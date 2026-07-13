const storefrontConnectionService = require('../services/storefrontConnection.service');
const { success } = require('../utils/apiResponse');

const listConnections = async (req, res, next) => {
  try {
    const data = await storefrontConnectionService.listConnections(req.tenant.id);
    return success(res, data, 200);
  } catch (err) { next(err); }
};

const connectStorefront = async (req, res, next) => {
  try {
    const { platform, store_url, access_token, api_secret } = req.body;
    const conn = await storefrontConnectionService.connectStorefront(req.tenant.id, {
      platform, storeUrl: store_url, accessToken: access_token, apiSecret: api_secret,
    });
    return success(res, conn, 201);
  } catch (err) { next(err); }
};

const getConnection = async (req, res, next) => {
  try {
    const conn = await storefrontConnectionService.getConnection(req.tenant.id, req.params.id);
    return success(res, conn, 200);
  } catch (err) { next(err); }
};

const updateConnection = async (req, res, next) => {
  try {
    const conn = await storefrontConnectionService.updateConnection(req.tenant.id, req.params.id, req.body);
    return success(res, conn, 200);
  } catch (err) { next(err); }
};

const disconnectStorefront = async (req, res, next) => {
  try {
    await storefrontConnectionService.disconnectStorefront(req.tenant.id, req.params.id);
    return success(res, null, 200);
  } catch (err) { next(err); }
};

const triggerSync = async (req, res, next) => {
  try {
    const result = await storefrontConnectionService.triggerManualSync(req.tenant.id, req.params.id);
    return success(res, result, 202);
  } catch (err) { next(err); }
};

const getSyncLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await storefrontConnectionService.getSyncLogs(req.tenant.id, req.params.id, parseInt(page), parseInt(limit));
    return success(res, data, 200);
  } catch (err) { next(err); }
};

module.exports = { listConnections, connectStorefront, getConnection, updateConnection, disconnectStorefront, triggerSync, getSyncLogs };
