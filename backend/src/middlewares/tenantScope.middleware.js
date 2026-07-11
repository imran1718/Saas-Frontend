const { Model } = require('sequelize');

/**
 * Middleware that adds a default scope to all tenant-owned Sequelize models
 * for the duration of this request.
 * It dynamically overrides the `addScope` at runtime for the current request context.
 * 
 * Note: A safer approach in Node.js (which is highly concurrent) is using AsyncLocalStorage (CLS).
 * For this spec, we will attach it explicitly in the repositories, but this middleware
 * can set up the context.
 */

const { AsyncLocalStorage } = require('async_hooks');
const tenantStorage = new AsyncLocalStorage();

const tenantScopeMiddleware = (req, res, next) => {
  if (!req.user || !req.user.tenant_id) {
    return next();
  }

  req.tenant = { id: req.user.tenant_id };

  // Store the tenant_id in the current async execution context
  tenantStorage.run(req.user.tenant_id, () => {
    next();
  });
};

// Helper to be used in Repositories/Models
const getCurrentTenantId = () => {
  return tenantStorage.getStore();
};

module.exports = {
  tenantScopeMiddleware,
  getCurrentTenantId,
};
