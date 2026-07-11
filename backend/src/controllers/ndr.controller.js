'use strict';

const { success } = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/errors');
const ndrEventRepository = require('../repositories/ndrEvent.repository');
const ndrService = require('../services/ndr.service');

const listNdrEvents = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { status, reason_code, date_from, date_to, page = 1, limit = 20 } = req.query;

    const data = await ndrEventRepository.findAll({
      tenant_id: tenantId,
      status,
      reason_code,
      date_from,
      date_to,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getNdrEventDetail = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const ndr = await ndrEventRepository.findById(id, tenantId);
    if (!ndr) {
      throw new NotFoundError('NDR event not found');
    }

    return success(res, ndr);
  } catch (err) {
    next(err);
  }
};

const takeAction = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;
    const { id } = req.params;

    const result = await ndrService.takeNdrAction(id, tenantId, userId, req.body);

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const takeBulkAction = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;

    const result = await ndrService.takeBulkNdrAction(tenantId, userId, req.body);

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;

    const summary = await ndrService.getNdrSummary(tenantId);

    return success(res, summary);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listNdrEvents,
  getNdrEventDetail,
  takeAction,
  takeBulkAction,
  getSummary,
};
