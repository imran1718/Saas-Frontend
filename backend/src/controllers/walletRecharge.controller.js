const walletRechargeService = require('../services/walletRecharge.service');
const { success } = require('../utils/apiResponse');

const initiateRecharge = async (req, res, next) => {
  try {
    const sellerId = req.tenant.id;
    const { amount_rupees } = req.body;
    const result = await walletRechargeService.initiateRecharge(sellerId, parseFloat(amount_rupees));
    return success(res, result, 201);
  } catch (err) { next(err); }
};

const verifyPayment = async (req, res, next) => {
  try {
    // Frontend notify — we just acknowledge; actual credit comes via webhook
    return success(res, { message: 'Payment received. Balance will update shortly.' }, 200);
  } catch (err) { next(err); }
};

const getRechargeHistory = async (req, res, next) => {
  try {
    const sellerId = req.tenant.id;
    const { page = 1, limit = 20 } = req.query;
    const result = await walletRechargeService.getRechargeHistory(sellerId, parseInt(page), parseInt(limit));
    return success(res, result, 200);
  } catch (err) { next(err); }
};

module.exports = { initiateRecharge, verifyPayment, getRechargeHistory };
