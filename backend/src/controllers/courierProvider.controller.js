'use strict';

const courierProviderService = require('../services/courierProvider.service');
const providerHealthService = require('../services/providerHealth.service');
const courierProviderRepository = require('../repositories/courierProvider.repository');
const { ProviderHealthLog, TenantCourierAccess } = require('../models');
const { success } = require('../utils/apiResponse');

const list = async (req, res, next) => {
  try {
    const { is_active, provider_key, page, limit } = req.query;
    const result = await courierProviderRepository.findAll({
      is_active,
      provider_key,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    // Add credentials mask placeholder to match AC
    const rows = result.rows.map(item => {
      const data = item.toJSON();
      delete data.credentials_encrypted;
      data.credentials = '***MASKED***';
      return data;
    });

    return success(res, { ...result, rows });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const provider = await courierProviderRepository.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Courier provider not found' } });
    }

    const data = provider.toJSON();
    delete data.credentials_encrypted;
    data.credentials = '***MASKED***';

    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const onboard = async (req, res, next) => {
  try {
    const platformAdminId = req.platformAdmin.id;
    const provider = await courierProviderService.onboard(req.body, platformAdminId, req);
    
    const data = provider.toJSON();
    delete data.credentials_encrypted;
    data.credentials = '***MASKED***';

    return success(res, data, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const platformAdminId = req.platformAdmin.id;
    const provider = await courierProviderService.update(req.params.id, req.body, platformAdminId, req);

    const data = provider.toJSON();
    delete data.credentials_encrypted;
    data.credentials = '***MASKED***';

    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const toggle = async (req, res, next) => {
  try {
    const platformAdminId = req.platformAdmin.id;
    const { is_active } = req.body;
    const provider = await courierProviderService.toggle(req.params.id, is_active, platformAdminId, req);

    const data = provider.toJSON();
    delete data.credentials_encrypted;
    data.credentials = '***MASKED***';

    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const healthCheck = async (req, res, next) => {
  try {
    const result = await providerHealthService.runHealthCheck(req.params.id);
    return success(res, { healthy: result.healthy, latency_ms: result.latencyMs });
  } catch (err) {
    next(err);
  }
};

const healthLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await ProviderHealthLog.findAndCountAll({
      where: { courier_provider_id: req.params.id },
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['checked_at', 'DESC']],
    });

    return success(res, {
      rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const grantAccess = async (req, res, next) => {
  try {
    const platformAdminId = req.platformAdmin.id;
    const { tenant_id } = req.body;
    const access = await courierProviderService.grantTenantAccess(req.params.id, tenant_id, platformAdminId, req);
    return success(res, access, 201);
  } catch (err) {
    next(err);
  }
};

const revokeAccess = async (req, res, next) => {
  try {
    const platformAdminId = req.platformAdmin.id;
    const { tenantId } = req.params;
    const result = await courierProviderService.revokeTenantAccess(req.params.id, tenantId, platformAdminId, req);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getCircuitBreakerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await courierProviderRepository.findById(id);
    if (!provider) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Courier provider not found' } });
    }
    
    const circuitBreakerUtil = require('../providers/shared/circuitBreaker.util');
    const status = await circuitBreakerUtil.getBreakerStatus(id);

    return success(res, {
      provider_id: id,
      database_state: provider.circuit_breaker_state,
      redis_state: status.state,
      consecutive_failures: status.failures,
      opened_at: provider.circuit_breaker_opened_at,
    });
  } catch (err) {
    next(err);
  }
};

const resetCircuitBreaker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await courierProviderRepository.findById(id);
    if (!provider) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Courier provider not found' } });
    }

    const circuitBreakerUtil = require('../providers/shared/circuitBreaker.util');
    await circuitBreakerUtil.resetBreaker(id);

    return success(res, {
      message: 'Circuit breaker reset successfully',
      provider_id: id,
      state: 'closed',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  onboard,
  update,
  toggle,
  healthCheck,
  healthLogs,
  grantAccess,
  revokeAccess,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
};
