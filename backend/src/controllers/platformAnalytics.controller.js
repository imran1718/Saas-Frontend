'use strict';

const platformAnalyticsService = require('../services/platformAnalytics.service');
const { success } = require('../utils/apiResponse');
const { BadRequestError, DateRangeTooLargeError } = require('../utils/errors');

const MAX_ANALYTICS_RANGE_DAYS = 366;

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
    throw new DateRangeTooLargeError(`Date range exceeds limit of ${MAX_ANALYTICS_RANGE_DAYS} days.`);
  }
}

const getRevenue = async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly';
    const months = parseInt(req.query.months, 10) || 6;
    const data = await platformAnalyticsService.getRevenueOverview(period, months);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getRevenueByPlan = async (req, res, next) => {
  try {
    const data = await platformAnalyticsService.getRevenueByPlan();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getTenantGrowth = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 6;
    const data = await platformAnalyticsService.getTenantGrowth(months);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getTopTenants = async (req, res, next) => {
  try {
    const sortBy = req.query.sort_by || 'volume'; // volume or revenue
    const limit = parseInt(req.query.limit, 10) || 20;
    const data = await platformAnalyticsService.getTopTenants(sortBy, limit);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getCourierOverview = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    validateDates(date_from, date_to);
    const data = await platformAnalyticsService.getCourierOverview(date_from, date_to);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getSystemHealth = async (req, res, next) => {
  try {
    const data = await platformAnalyticsService.getSystemHealth();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRevenue,
  getRevenueByPlan,
  getTenantGrowth,
  getTopTenants,
  getCourierOverview,
  getSystemHealth,
};
