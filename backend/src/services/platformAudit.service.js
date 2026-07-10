const { PlatformAuditLog } = require('../models');

const log = async ({ platform_admin_id, action, target_tenant_id, entity_type, entity_id, metadata, ip_address }) => {
  try {
    await PlatformAuditLog.create({
      platform_admin_id,
      action,
      target_tenant_id,
      entity_type,
      entity_id,
      metadata,
      ip_address,
    });
  } catch (error) {
    console.error('Failed to write platform audit log:', error);
  }
};

module.exports = {
  log,
};
