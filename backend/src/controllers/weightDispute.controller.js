'use strict';

const weightDisputeService = require('../services/weightDispute.service');
const { success } = require('../utils/apiResponse');

// Seller endpoints
const fileDispute = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const dispute = await weightDisputeService.fileDispute(tenantId, req.body);
    return success(res, dispute, 201);
  } catch (err) {
    next(err);
  }
};

const listMyDisputes = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const disputes = await weightDisputeService.listDisputes(tenantId);
    return success(res, disputes);
  } catch (err) {
    next(err);
  }
};

const getMyDispute = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const dispute = await weightDisputeService.getDispute(id, tenantId);
    if (!dispute) return res.status(404).json({ success: false, error: { message: 'Dispute not found' } });
    return success(res, dispute);
  } catch (err) {
    next(err);
  }
};

// Admin endpoints
const listAllDisputes = async (req, res, next) => {
  try {
    const disputes = await weightDisputeService.listDisputes();
    return success(res, disputes);
  } catch (err) {
    next(err);
  }
};

const resolveDispute = async (req, res, next) => {
  try {
    const adminId = req.platformAdmin.id;
    const { id } = req.params;
    const { resolution, admin_notes, approved_weight_kg } = req.body;
    const resolved = await weightDisputeService.resolveDispute(id, adminId, { resolution, admin_notes, approved_weight_kg });
    return success(res, resolved);
  } catch (err) {
    next(err);
  }
};

module.exports = { fileDispute, listMyDisputes, getMyDispute, listAllDisputes, resolveDispute };
