const { sequelize, PasswordResetToken } = require('../models');
const userRepository = require('../repositories/user.repository');
const tenantRepository = require('../repositories/tenant.repository');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const auditService = require('./audit.service');
const hashUtils = require('../utils/hash');
const totpUtils = require('../utils/totp');
const config = require('../config/env');
const { Op } = require('sequelize');

class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

class ConflictError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ConflictError';
    this.code = code;
  }
}

const register = async ({ company_name, subdomain, name, email, password, phone }) => {
  const existingTenant = await tenantRepository.findBySubdomain(subdomain);
  if (existingTenant) {
    throw new ConflictError('This subdomain is already in use', 'SUBDOMAIN_TAKEN');
  }

  // Transaction to ensure atomicity
  const result = await sequelize.transaction(async (t) => {
    // 1. Create Tenant
    const tenant = await tenantRepository.create({
      company_name,
      subdomain,
      status: 'pending',
    }, t);

    // Initialize Wallet
    const { Wallet } = require('../models');
    await Wallet.create({
      tenant_id: tenant.id,
      balance: 0.00,
      low_balance_threshold: 500.00,
      currency: 'INR',
    }, { transaction: t });

    // Initialize Subscription Plan (Module 13 Hook)
    const subscriptionPlanService = require('./subscriptionPlan.service');
    await subscriptionPlanService.initializeTenantSubscription(tenant.id, t);

    // 2. Fetch global owner role
    const globalOwnerRole = await tenantRepository.findGlobalRoleByName('owner');
    if (!globalOwnerRole) {
      throw new Error('System owner role not found');
    }

    // 3. Clone to tenant-specific role
    const tenantRole = await tenantRepository.createTenantRole({
      tenant_id: tenant.id,
      name: 'owner',
      is_system_role: false,
    }, t);

    await tenantRepository.cloneRolePermissions(globalOwnerRole.id, tenantRole.id, t);

    // Auto-grant Mock Courier Provider access to the tenant (Module 6 hook)
    const { CourierProvider, TenantCourierAccess } = require('../models');
    const mockProvider = await CourierProvider.findOne({ where: { provider_key: 'mock' }, transaction: t });
    if (mockProvider) {
      await TenantCourierAccess.create({
        tenant_id: tenant.id,
        courier_provider_id: mockProvider.id,
        is_enabled: true,
      }, { transaction: t });
    }

    // 4. Create User
    const password_hash = await hashUtils.hashPassword(password);
    const user = await userRepository.create({
      tenant_id: tenant.id,
      role_id: tenantRole.id,
      name,
      email,
      password_hash,
      phone,
      status: 'pending',
    }, t);

    return { tenant, user };
  });

  // 5. Generate email verification token & send email (outside transaction)
  const verificationToken = tokenService.signEmailVerificationToken({
    user_id: result.user.id,
    tenant_id: result.tenant.id,
  });

  const verificationLink = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
  
  await emailService.sendEmail({
    to: email,
    subject: 'Verify your ShippingSaaS account',
    templateName: 'verify-email',
    data: { name, companyName: company_name, verificationLink },
  });

  return {
    tenant_id: result.tenant.id,
    user_id: result.user.id,
    message: 'Verification email sent',
  };
};

const verifyEmail = async ({ token }) => {
  let payload;
  try {
    payload = tokenService.verifyEmailVerificationToken(token);
  } catch (err) {
    throw new AuthError('Invalid or expired verification token', 'INVALID_TOKEN');
  }

  const user = await userRepository.findById(payload.user_id);
  if (!user) throw new AuthError('User not found', 'USER_NOT_FOUND');
  if (user.email_verified_at) throw new ConflictError('Email already verified', 'ALREADY_VERIFIED');

  await sequelize.transaction(async (t) => {
    await userRepository.update(user.id, {
      email_verified_at: new Date(),
      status: 'active',
    }, t);

    const tenant = await tenantRepository.findById(user.tenant_id);
    if (tenant.status === 'pending') {
      await tenant.update({ status: 'active' }, { transaction: t });
    }
  });

  const updatedUser = await userRepository.findById(user.id);

  // Send Welcome Email
  await emailService.sendEmail({
    to: updatedUser.email,
    subject: 'Welcome to ShippingSaaS',
    templateName: 'welcome',
    data: { 
      name: updatedUser.name, 
      companyName: updatedUser.tenant.company_name,
      loginLink: `${config.frontendUrl}/login`,
    },
  });

  return { message: 'Email verified successfully' };
};

const login = async ({ email, password, subdomain, deviceInfo, ipAddress }, req) => {
  const tenant = await tenantRepository.findBySubdomain(subdomain);
  if (!tenant) {
    await auditService.log({ action: 'login_failed', metadata: { reason: 'tenant_not_found', subdomain, email }, req });
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const user = await userRepository.findByEmailAndTenant(email, tenant.id, true);
  if (!user) {
    await auditService.log({ action: 'login_failed', tenant_id: tenant.id, metadata: { reason: 'user_not_found', email }, req });
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const isMatch = await hashUtils.comparePassword(password, user.password_hash);
  if (!isMatch) {
    await auditService.log({ action: 'login_failed', tenant_id: tenant.id, user_id: user.id, metadata: { reason: 'wrong_password' }, req });
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (tenant.status === 'suspended') {
    throw new AuthError('Account suspended', 'TENANT_SUSPENDED');
  }
  
  if (!user.email_verified_at && process.env.NODE_ENV !== 'development') {
    throw new AuthError('Email not verified', 'EMAIL_NOT_VERIFIED');
  }

  if (user.status !== 'active' && process.env.NODE_ENV !== 'development') {
    throw new AuthError('User account not active', 'USER_INACTIVE');
  }

  if (user.two_factor_enabled) {
    // Generate a temporary token valid for 5 mins to confirm 2FA
    const tempToken = tokenService.signAccessToken({ user_id: user.id, requires_2fa: true });
    return { requires_2fa: true, temp_token: tempToken };
  }

  return completeLogin(user, tenant, deviceInfo, ipAddress, req);
};

const completeLogin = async (user, tenant, deviceInfo, ipAddress, req) => {
  // Update last login
  await userRepository.update(user.id, { last_login_at: new Date() });

  const accessPayload = {
    user_id: user.id,
    tenant_id: tenant.id,
    role: user.role.name,
  };

  const accessToken = tokenService.signAccessToken(accessPayload);
  const refreshToken = await tokenService.generateRefreshToken(user.id, deviceInfo, ipAddress);

  await auditService.log({ action: 'login', tenant_id: tenant.id, user_id: user.id, req });

  // Exclude sensitive details
  const { password_hash, two_factor_secret, ...safeUser } = user.toJSON();

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 900, // 15m
    user: safeUser,
  };
};

const refreshToken = async ({ token, deviceInfo, ipAddress }) => {
  const result = await tokenService.rotateRefreshToken(token, deviceInfo, ipAddress);
  const user = await userRepository.findById(result.userId);
  if (!user || user.status !== 'active' || user.tenant.status === 'suspended') {
    throw new AuthError('Account inactive or suspended', 'ACCOUNT_INACTIVE');
  }

  const accessToken = tokenService.signAccessToken({
    user_id: user.id,
    tenant_id: user.tenant.id,
    role: user.role.name,
  });

  return {
    access_token: accessToken,
    refresh_token: result.newToken,
    expires_in: 900,
  };
};

const logout = async (token, user_id, req) => {
  await tokenService.revokeRefreshToken(token);
  if (user_id) {
    await auditService.log({ action: 'logout', user_id, req });
  }
};

const forgotPassword = async ({ email, subdomain }, req) => {
  const tenant = await tenantRepository.findBySubdomain(subdomain);
  if (!tenant) return { message: 'If the account exists, a reset link has been sent.' };

  const user = await userRepository.findByEmailAndTenant(email, tenant.id);
  if (!user) return { message: 'If the account exists, a reset link has been sent.' };

  const plainToken = hashUtils.generateResetToken();
  const tokenHash = hashUtils.sha256(plainToken);
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

  await PasswordResetToken.create({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  const resetLink = `${config.frontendUrl}/reset-password?token=${plainToken}`;

  await emailService.sendEmail({
    to: email,
    subject: 'Reset your ShippingSaaS Password',
    templateName: 'reset-password',
    data: { name: user.name, resetLink },
  });

  await auditService.log({ action: 'password_reset_requested', tenant_id: tenant.id, user_id: user.id, req });

  return { message: 'If the account exists, a reset link has been sent.' };
};

const resetPassword = async ({ token, new_password }, req) => {
  const tokenHash = hashUtils.sha256(token);
  const resetRecord = await PasswordResetToken.findOne({
    where: {
      token_hash: tokenHash,
      used_at: null,
      expires_at: { [Op.gt]: new Date() }
    }
  });

  if (!resetRecord) {
    throw new AuthError('Invalid or expired reset token', 'INVALID_TOKEN');
  }

  const password_hash = await hashUtils.hashPassword(new_password);
  
  await sequelize.transaction(async (t) => {
    await userRepository.update(resetRecord.user_id, { password_hash }, t);
    await resetRecord.update({ used_at: new Date() }, { transaction: t });
  });

  await auditService.log({ action: 'password_reset_completed', user_id: resetRecord.user_id, req });

  return { message: 'Password reset successful' };
};

const enable2FA = async (userId) => {
  const user = await userRepository.findById(userId);
  if (user.two_factor_enabled) throw new ConflictError('2FA already enabled', '2FA_ALREADY_ENABLED');

  const secret = totpUtils.generateSecret();
  const otpAuthUri = totpUtils.generateOtpAuthUri(user.email, secret, 'ShippingSaaS');
  const qrCode = await totpUtils.generateQRCode(otpAuthUri);

  const encryptedSecret = hashUtils.encryptAES(secret);
  await userRepository.update(user.id, { two_factor_secret: encryptedSecret });

  return { secret, qrCode }; // Warning: showing plain secret once for manual entry
};

const confirm2FA = async (userId, otp, req) => {
  const user = await userRepository.findById(userId, false, true);
  if (user.two_factor_enabled) throw new ConflictError('2FA already enabled', '2FA_ALREADY_ENABLED');

  if (!user.two_factor_secret) {
    throw new AuthError('2FA setup not initiated', '2FA_NOT_INITIATED');
  }

  const plainSecret = hashUtils.decryptAES(user.two_factor_secret);
  const isValid = totpUtils.verifyToken(otp, plainSecret);

  if (!isValid) throw new AuthError('Invalid OTP code', 'INVALID_OTP');

  await userRepository.update(user.id, { two_factor_enabled: true });
  await auditService.log({ action: '2fa_enabled', user_id: user.id, tenant_id: user.tenant_id, req });

  return { message: '2FA successfully enabled' };
};

const verify2FA = async ({ temp_token, otp, deviceInfo, ipAddress }, req) => {
  let payload;
  try {
    payload = tokenService.verifyAccessToken(temp_token);
  } catch (err) {
    throw new AuthError('Invalid or expired temporary token', 'INVALID_TOKEN');
  }

  if (!payload.requires_2fa) {
    throw new AuthError('Invalid token usage', 'INVALID_TOKEN');
  }

  const user = await userRepository.findById(payload.user_id, false, true);
  if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
    throw new AuthError('2FA is not enabled for this user', '2FA_NOT_ENABLED');
  }

  const plainSecret = hashUtils.decryptAES(user.two_factor_secret);
  const isValid = totpUtils.verifyToken(otp, plainSecret);

  if (!isValid) {
    await auditService.log({ action: 'login_failed_2fa', tenant_id: user.tenant_id, user_id: user.id, req });
    throw new AuthError('Invalid OTP code', 'INVALID_OTP');
  }

  const tenant = await tenantRepository.findById(user.tenant_id);
  return completeLogin(user, tenant, deviceInfo, ipAddress, req);
};

module.exports = {
  AuthError,
  ConflictError,
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  enable2FA,
  confirm2FA,
  verify2FA,
};
