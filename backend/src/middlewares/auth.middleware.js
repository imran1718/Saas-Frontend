const { verifyAccessToken } = require('../services/token.service');
const { error } = require('../utils/apiResponse');
const { Tenant, User, Role, Permission } = require('../models');
const { getRedisClient } = require('../config/redis.config');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, { code: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Explicitly reject platform tokens
    if (payload.aud === 'platform-admin') {
      return error(res, { code: 'FORBIDDEN', message: 'Invalid token audience' }, 403);
    }

    if (payload.requires_2fa) {
      return error(res, { code: '2FA_REQUIRED', message: '2FA verification required' }, 403);
    }

    // Check if tenant is suspended (caching this check in Redis later would be an optimization)
    const tenant = await Tenant.findByPk(payload.tenant_id, { attributes: ['status'] });
    if (!tenant || tenant.status === 'suspended') {
      return error(res, { code: 'TENANT_SUSPENDED', message: 'Account suspended' }, 403);
    }

    // Cache check for permissions
    const redis = getRedisClient();
    const cacheKey = `perm:${payload.user_id}`;
    let permissions = [];
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        permissions = JSON.parse(cached);
      }
    }

    if (!permissions.length) {
      const user = await User.findByPk(payload.user_id, {
        include: [{
          model: Role,
          as: 'role',
          include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
        }]
      });
      if (user && user.role) {
        permissions = user.role.permissions.map(p => p.key);
        if (redis) {
          await redis.set(cacheKey, JSON.stringify(permissions), 'EX', 300); // 5 min TTL
        }
      }
    }

    req.user = {
      id: payload.user_id,
      tenant_id: payload.tenant_id,
      role: payload.role,
      permissions,
      impersonated: payload.impersonated || false,
      impersonated_by: payload.impersonated_by || null,
      impersonator_role: payload.impersonator_role || null,
    };

    // Global block on writes during impersonation (unless explicitly allow-listed)
    if (req.user.impersonated) {
      const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
      if (isWriteMethod) {
        // Only super_admin could potentially have a whitelist, but by default we block all writes
        // In this implementation, we just block all writes
        return error(res, { code: 'IMPERSONATION_READ_ONLY', message: 'Write operations are disabled during impersonation' }, 403);
      }
    }

    req.tenant = { id: payload.tenant_id };

    const { tenantScopeMiddleware } = require('./tenantScope.middleware');
    tenantScopeMiddleware(req, res, next);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, { code: 'TOKEN_EXPIRED', message: 'Token expired' }, 401);
    }
    return error(res, { code: 'UNAUTHORIZED', message: 'Invalid token' }, 401);
  }
};

module.exports = {
  authenticate,
};
