const sequelize = require('../config/db.config');

const Tenant = require('./tenant.model');
const Role = require('./role.model');
const Permission = require('./permission.model');
const User = require('./user.model');
const RefreshToken = require('./refreshToken.model');
const AuditLog = require('./auditLog.model');
const PasswordResetToken = require('./passwordResetToken.model');
const PickupAddress = require('./pickupAddress.model');
const CompanyDocument = require('./companyDocument.model');

// Platform Models
const PlatformAdmin = require('./platformAdmin.model');
const PlatformPermission = require('./platformPermission.model');
const PlatformRolePermission = require('./platformRolePermission.model');
const PlatformAuditLog = require('./platformAuditLog.model');
const ImpersonationSession = require('./impersonationSession.model');
const PlatformRefreshToken = require('./platformRefreshToken.model');

// --- Associations ---

// Tenant - User
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant - Role (tenant-specific roles)
Tenant.hasMany(Role, { foreignKey: 'tenant_id', as: 'roles' });
Role.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Role - User
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Role - Permission (Many-to-Many via role_permissions table)
Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', as: 'roles' });

// User - RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - PasswordResetToken
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'passwordResetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Tenant/User - AuditLog
Tenant.hasMany(AuditLog, { foreignKey: 'tenant_id', as: 'auditLogs' });
AuditLog.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// PlatformAdmin - PlatformAuditLog
PlatformAdmin.hasMany(PlatformAuditLog, { foreignKey: 'platform_admin_id', as: 'auditLogs' });
PlatformAuditLog.belongsTo(PlatformAdmin, { foreignKey: 'platform_admin_id', as: 'admin' });

// Tenant - PlatformAuditLog
Tenant.hasMany(PlatformAuditLog, { foreignKey: 'target_tenant_id', as: 'platformAuditLogs' });
PlatformAuditLog.belongsTo(Tenant, { foreignKey: 'target_tenant_id', as: 'tenant' });

// PlatformAdmin - ImpersonationSession
PlatformAdmin.hasMany(ImpersonationSession, { foreignKey: 'platform_admin_id', as: 'impersonationSessions' });
ImpersonationSession.belongsTo(PlatformAdmin, { foreignKey: 'platform_admin_id', as: 'admin' });

// PlatformAdmin - PlatformRefreshToken
PlatformAdmin.hasMany(PlatformRefreshToken, { foreignKey: 'admin_id', as: 'refreshTokens' });
PlatformRefreshToken.belongsTo(PlatformAdmin, { foreignKey: 'admin_id', as: 'admin' });

// Tenant - ImpersonationSession
Tenant.hasMany(ImpersonationSession, { foreignKey: 'target_tenant_id', as: 'impersonationSessions' });
ImpersonationSession.belongsTo(Tenant, { foreignKey: 'target_tenant_id', as: 'tenant' });

// User - ImpersonationSession
User.hasMany(ImpersonationSession, { foreignKey: 'target_user_id', as: 'impersonationSessions' });
ImpersonationSession.belongsTo(User, { foreignKey: 'target_user_id', as: 'user' });

module.exports = {
  sequelize,
  Tenant,
  Role,
  Permission,
  User,
  RefreshToken,
  AuditLog,
  PasswordResetToken,
  PlatformAdmin,
  PlatformPermission,
  PlatformRolePermission,
  PlatformAuditLog,
  ImpersonationSession,
  PlatformRefreshToken,
  PickupAddress,
  CompanyDocument,
};
