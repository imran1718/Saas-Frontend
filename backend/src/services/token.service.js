const jwt = require('jsonwebtoken');
const config = require('../config/env');
const hashUtils = require('../utils/hash');
const refreshTokenRepo = require('../repositories/refreshToken.repository');
const { PlatformRefreshToken } = require('../models');

const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

const signPlatformAccessToken = (payload) => {
  return jwt.sign({ ...payload, aud: 'platform-admin' }, config.jwt.platformAccessSecret, {
    expiresIn: config.jwt.platformAccessExpiry,
  });
};

const verifyPlatformAccessToken = (token) => {
  return jwt.verify(token, config.jwt.platformAccessSecret, { audience: 'platform-admin' });
};

const signImpersonationToken = (payload) => {
  // Impersonation token uses the regular tenant access secret but carries the impersonated claims
  return jwt.sign({ ...payload, impersonated: true }, config.jwt.accessSecret, {
    expiresIn: config.jwt.platformImpersonationExpiry,
  });
};

const signEmailVerificationToken = (payload) => {
  // Use access secret but maybe with a different expiry (e.g. 24h)
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: '24h',
  });
};

const verifyEmailVerificationToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

const generateRefreshToken = async (userId, deviceInfo, ipAddress) => {
  const token = hashUtils.generateOpaqueToken();
  const tokenHash = hashUtils.sha256(token);
  
  // Parse '30d' into actual date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await refreshTokenRepo.create({
    user_id: userId,
    token_hash: tokenHash,
    device_info: deviceInfo,
    ip_address: ipAddress,
    expires_at: expiresAt,
  });

  return token;
};

const generatePlatformRefreshToken = async (adminId, deviceInfo, ipAddress) => {
  const token = hashUtils.generateOpaqueToken();
  const tokenHash = hashUtils.sha256(token);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Platform uses 7 days

  await PlatformRefreshToken.create({
    admin_id: adminId,
    token_hash: tokenHash,
    device_info: deviceInfo,
    ip_address: ipAddress,
    expires_at: expiresAt,
  });

  return token;
};

const rotateRefreshToken = async (oldToken, deviceInfo, ipAddress) => {
  const tokenHash = hashUtils.sha256(oldToken);
  const existingRecord = await refreshTokenRepo.findByHash(tokenHash);

  if (!existingRecord) {
    throw new Error('Invalid refresh token');
  }

  // Breach detection: token is already revoked, but someone is trying to use it again.
  // This means the token was likely stolen.
  if (existingRecord.revoked_at) {
    // Revoke all tokens for this user (family revocation)
    await refreshTokenRepo.revokeFamily(existingRecord.user_id);
    throw new Error('Refresh token reuse detected. All sessions revoked.');
  }

  // Token is expired
  if (new Date() > existingRecord.expires_at) {
    throw new Error('Refresh token expired');
  }

  // Revoke the old token
  await refreshTokenRepo.revoke(existingRecord.id);

  // Generate a new one
  const newToken = await generateRefreshToken(existingRecord.user_id, deviceInfo, ipAddress);
  
  return { newToken, userId: existingRecord.user_id };
};

const revokeRefreshToken = async (token) => {
  if (!token) return;
  const tokenHash = hashUtils.sha256(token);
  const existingRecord = await refreshTokenRepo.findByHash(tokenHash);
  if (existingRecord && !existingRecord.revoked_at) {
    await refreshTokenRepo.revoke(existingRecord.id);
  }
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
  generateRefreshToken,
  generatePlatformRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  signPlatformAccessToken,
  verifyPlatformAccessToken,
  signImpersonationToken,
};
