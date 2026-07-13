'use strict';

const { AuditLog, PlatformAuditLog, User, Tenant } = require('../models');
const { Op } = require('sequelize');

// ─────────────────────────────────────────────
// Tenant Audit Log (audit_logs)
// ─────────────────────────────────────────────

/**
 * Search tenant audit log with filters, pagination.
 * @param {object} params
 */
const searchTenantAuditLog = async ({
  tenantId,
  action = null,
  entityType = null,
  userId = null,
  dateFrom = null,
  dateTo = null,
  page = 1,
  limit = 50,
}) => {
  const where = { tenant_id: tenantId };

  if (action) where.action = { [Op.iLike]: `%${action}%` };
  if (entityType) where.entity_type = { [Op.iLike]: `%${entityType}%` };
  if (userId) where.user_id = userId;

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
    if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    include: [
      {
        model: User,
        as: 'actor',
        attributes: ['id', 'name', 'email'],
        required: false,
      },
    ],
  });

  return {
    items: rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Fetch all tenant audit log rows for CSV export (capped at maxRows).
 */
const getTenantAuditLogForExport = async ({
  tenantId,
  action = null,
  entityType = null,
  dateFrom = null,
  dateTo = null,
  maxRows = 50000,
}) => {
  const where = { tenant_id: tenantId };

  if (action) where.action = { [Op.iLike]: `%${action}%` };
  if (entityType) where.entity_type = { [Op.iLike]: `%${entityType}%` };
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
    if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
  }

  return AuditLog.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(maxRows, 10),
    attributes: ['id', 'action', 'entity_type', 'entity_id', 'user_id', 'ip_address', 'metadata', 'created_at'],
  });
};

// ─────────────────────────────────────────────
// Platform Audit Log (platform_audit_logs)
// ─────────────────────────────────────────────

/**
 * Search platform audit log with filters, pagination.
 */
const searchPlatformAuditLog = async ({
  action = null,
  targetTenantId = null,
  entityType = null,
  adminId = null,
  dateFrom = null,
  dateTo = null,
  page = 1,
  limit = 50,
}) => {
  const where = {};

  if (action) where.action = { [Op.iLike]: `%${action}%` };
  if (targetTenantId) where.target_tenant_id = targetTenantId;
  if (entityType) where.entity_type = { [Op.iLike]: `%${entityType}%` };
  if (adminId) where.platform_admin_id = adminId;

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
    if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await PlatformAuditLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });

  return {
    items: rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Fetch platform audit log rows for CSV export.
 */
const getPlatformAuditLogForExport = async ({
  action = null,
  targetTenantId = null,
  entityType = null,
  dateFrom = null,
  dateTo = null,
  maxRows = 50000,
}) => {
  const where = {};
  if (action) where.action = { [Op.iLike]: `%${action}%` };
  if (targetTenantId) where.target_tenant_id = targetTenantId;
  if (entityType) where.entity_type = { [Op.iLike]: `%${entityType}%` };
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
    if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
  }

  return PlatformAuditLog.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(maxRows, 10),
    attributes: ['id', 'action', 'entity_type', 'entity_id', 'target_tenant_id', 'platform_admin_id', 'ip_address', 'metadata', 'created_at'],
  });
};

// ─────────────────────────────────────────────
// Retention Queries
// ─────────────────────────────────────────────

/**
 * Delete old tenant audit log rows in batches, excluding financial/security actions.
 * @param {Date} cutoffDate
 * @param {number} batchSize
 * @returns {number} total rows deleted
 */
const deleteOldTenantAuditLogs = async (cutoffDate, financialCutoffDate, batchSize = 1000) => {
  const FINANCIAL_PREFIXES = ['wallet_', 'invoice_', 'subscription_', 'recharge_'];
  const SECURITY_PREFIXES = ['login', 'impersonation_', 'password_reset', '2fa_'];
  
  let totalDeleted = 0;
  let deleted;

  do {
    // Build a NOT LIKE clause for financial/security actions
    const { sequelize } = require('../models');
    const exemptConditions = [
      ...FINANCIAL_PREFIXES.map(p => ({ action: { [Op.iLike]: `${p}%` }, created_at: { [Op.gte]: financialCutoffDate } })),
      ...SECURITY_PREFIXES.map(p => ({ action: { [Op.iLike]: `${p}%` }, created_at: { [Op.gte]: financialCutoffDate } })),
    ];

    const rowsToDelete = await AuditLog.findAll({
      where: {
        created_at: { [Op.lt]: cutoffDate },
        [Op.not]: exemptConditions,
      },
      limit: batchSize,
      attributes: ['id'],
    });

    if (rowsToDelete.length === 0) break;
    const ids = rowsToDelete.map(r => r.id);
    deleted = await AuditLog.destroy({ where: { id: { [Op.in]: ids } } });
    totalDeleted += deleted;
  } while (deleted === batchSize);

  return totalDeleted;
};

/**
 * Delete old platform audit log rows in batches.
 */
const deleteOldPlatformAuditLogs = async (cutoffDate, financialCutoffDate, batchSize = 1000) => {
  const FINANCIAL_PREFIXES = ['wallet_', 'invoice_', 'subscription_', 'recharge_'];
  const SECURITY_PREFIXES = ['login', 'impersonation_', 'password_reset', '2fa_'];

  let totalDeleted = 0;
  let deleted;

  do {
    const exemptConditions = [
      ...FINANCIAL_PREFIXES.map(p => ({ action: { [Op.iLike]: `${p}%` }, created_at: { [Op.gte]: financialCutoffDate } })),
      ...SECURITY_PREFIXES.map(p => ({ action: { [Op.iLike]: `${p}%` }, created_at: { [Op.gte]: financialCutoffDate } })),
    ];

    const rowsToDelete = await PlatformAuditLog.findAll({
      where: {
        created_at: { [Op.lt]: cutoffDate },
        [Op.not]: exemptConditions,
      },
      limit: batchSize,
      attributes: ['id'],
    });

    if (rowsToDelete.length === 0) break;
    const ids = rowsToDelete.map(r => r.id);
    deleted = await PlatformAuditLog.destroy({ where: { id: { [Op.in]: ids } } });
    totalDeleted += deleted;
  } while (deleted === batchSize);

  return totalDeleted;
};

module.exports = {
  searchTenantAuditLog,
  getTenantAuditLogForExport,
  searchPlatformAuditLog,
  getPlatformAuditLogForExport,
  deleteOldTenantAuditLogs,
  deleteOldPlatformAuditLogs,
};
