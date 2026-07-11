'use strict';

const rateComparisonService = require('../services/rateComparison.service');
const { success } = require('../utils/apiResponse');

const compareRates = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const tenantId = req.tenant.id;
    const userId = req.user.id;

    const result = await rateComparisonService.compareRates(orderId, tenantId, userId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  compareRates,
};
