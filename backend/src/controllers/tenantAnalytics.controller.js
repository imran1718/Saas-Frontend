'use strict';

const tenantAnalyticsService = require('../services/tenantAnalytics.service');
const { success, error } = require('../utils/apiResponse');
const { BadRequestError, DateRangeTooLargeError } = require('../utils/errors');

const MAX_ANALYTICS_RANGE_DAYS = parseInt(process.env.MAX_ANALYTICS_RANGE_DAYS, 10) || 366;

/**
 * Validates date_from and date_to range.
 */
function validateDates(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) {
    throw new BadRequestError('Both date_from and date_to query parameters are required.');
  }

  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new BadRequestError('Invalid date formats. Please use YYYY-MM-DD.');
  }

  if (from > to) {
    throw new BadRequestError('date_from cannot be after date_to.');
  }

  const diffTime = Math.abs(to - from);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > MAX_ANALYTICS_RANGE_DAYS) {
    throw new DateRangeTooLargeError(`Date range exceeds maximum allowed limit of ${MAX_ANALYTICS_RANGE_DAYS} days.`);
  }
}

const getOverview = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    validateDates(date_from, date_to);
    const data = await tenantAnalyticsService.getOverview(req.user.tenant_id, date_from, date_to);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getOrdersTrend = async (req, res, next) => {
  try {
    const { date_from, date_to, granularity } = req.query;
    validateDates(date_from, date_to);
    const data = await tenantAnalyticsService.getOrdersTrend(
      req.user.tenant_id,
      date_from,
      date_to,
      granularity || 'daily'
    );
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getCourierPerformance = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    validateDates(date_from, date_to);
    const data = await tenantAnalyticsService.getCourierPerformance(req.user.tenant_id, date_from, date_to);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getZoneDistribution = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    validateDates(date_from, date_to);
    const data = await tenantAnalyticsService.getZoneDistribution(req.user.tenant_id, date_from, date_to);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getPaymentSplit = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    validateDates(date_from, date_to);
    const data = await tenantAnalyticsService.getPaymentSplit(req.user.tenant_id, date_from, date_to);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getWalletSpend = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    validateDates(date_from, date_to);
    const data = await tenantAnalyticsService.getWalletSpendTrend(req.user.tenant_id, date_from, date_to);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getNdrRtoTrend = async (req, res, next) => {
  try {
    const { date_from, date_to, granularity } = req.query;
    validateDates(date_from, date_to);
    const data = await tenantAnalyticsService.getNdrRtoTrend(
      req.user.tenant_id,
      date_from,
      date_to,
      granularity || 'daily'
    );
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  getOrdersTrend,
  getCourierPerformance,
  getZoneDistribution,
  getPaymentSplit,
  getWalletSpend,
  getNdrRtoTrend,
};
