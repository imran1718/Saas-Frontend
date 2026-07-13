'use strict';

const settingsService = require('../services/settings.service');
const { success } = require('../utils/apiResponse');
const { PlatformAuditLog } = require('../models');
const logger = require('../utils/logger');

/**
 * GET /api/v1/platform/settings
 * Returns all platform settings rows.
 */
const getPlatformSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getPlatformSettings();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/platform/settings/:key
 * Update a single platform setting by key.
 */
const updatePlatformSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { setting_value } = req.body;

    const updated = await settingsService.updatePlatformSetting(
      key,
      setting_value,
      req.platformAdmin.id
    );

    // Log to platform audit log
    try {
      await PlatformAuditLog.create({
        platform_admin_id: req.platformAdmin.id,
        action: 'platform_setting_updated',
        entity_type: 'platform_setting',
        entity_id: key,
        metadata: { setting_key: key, new_value: setting_value },
        ip_address: req.ip || req.headers['x-forwarded-for'],
      });
    } catch (logErr) {
      logger.error('[PlatformSettingsController] Failed to write audit log', { error: logErr.message });
    }

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSetting,
};
