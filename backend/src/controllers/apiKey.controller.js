'use strict';

const apiKeyService = require('../services/apiKey.service');
const apiKeyUsageService = require('../services/apiKeyUsage.service');

class ApiKeyController {
  async createKey(req, res, next) {
    try {
      const { name, scopes, expires_at } = req.body;
      const { apiKey, rawKey } = await apiKeyService.createApiKey(req.tenant_id, req.user_id, {
        name,
        scopes,
        expires_at
      });

      res.status(201).json({
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          api_key: rawKey, // Shown only once
          key_prefix: apiKey.key_prefix,
          scopes: apiKey.scopes,
          expires_at: apiKey.expires_at,
          warning: 'This is the only time the full API key will be shown. Store it securely.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async listKeys(req, res, next) {
    try {
      const apiKeys = await apiKeyService.listApiKeys(req.tenant_id);
      res.status(200).json({
        success: true,
        data: apiKeys.rows,
        total: apiKeys.count
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeKey(req, res, next) {
    try {
      const { id } = req.params;
      const updatedKey = await apiKeyService.revokeApiKey(id, req.tenant_id);
      
      if (!updatedKey) {
        return res.status(404).json({ success: false, error: 'API Key not found or already revoked' });
      }

      res.status(200).json({
        success: true,
        data: updatedKey
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsageLogs(req, res, next) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const logs = await apiKeyUsageService.getUsageLogs(id, req.tenant_id, { limit, offset });
      
      res.status(200).json({
        success: true,
        data: logs.rows,
        total: logs.count,
        page,
        limit
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApiKeyController();
