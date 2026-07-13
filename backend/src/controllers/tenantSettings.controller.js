'use strict';

const settingsService = require('../services/settings.service');
const auditService = require('../services/audit.service');
const { success } = require('../utils/apiResponse');

/**
 * GET /api/v1/settings
 * Returns the tenant's effective settings with source metadata.
 */
const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getTenantSettings(req.user.tenant_id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/settings
 * Update one or more tenant setting overrides.
 */
const updateSettings = async (req, res, next) => {
  try {
    await settingsService.updateTenantSettings(
      req.user.tenant_id,
      req.user.id,
      req.body
    );

    await auditService.log({
      action: 'tenant_settings_updated',
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
      entity_type: 'tenant_settings',
      entity_id: req.user.tenant_id,
      metadata: { updated_keys: Object.keys(req.body) },
      req,
    });

    const updated = await settingsService.getTenantSettings(req.user.tenant_id);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
