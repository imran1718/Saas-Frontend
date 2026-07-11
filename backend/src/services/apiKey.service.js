'use strict';

const crypto = require('crypto');
const apiKeyRepository = require('../repositories/apiKey.repository');

class ApiKeyService {
  /**
   * Hashes a raw API key using SHA-256
   */
  hashKey(rawKey) {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Generates a new raw API key in the format sk_live_{32 random hex chars}
   */
  generateRawKey() {
    const randomHex = crypto.randomBytes(16).toString('hex');
    return `sk_live_${randomHex}`;
  }

  async createApiKey(tenantId, userId, data) {
    const rawKey = this.generateRawKey();
    const keyHash = this.hashKey(rawKey);
    // Prefix is the first 12 characters
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await apiKeyRepository.create({
      tenant_id: tenantId,
      name: data.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: data.scopes || [],
      expires_at: data.expires_at || null,
      created_by: userId,
    });

    // Return the model + the raw key just this once
    return {
      apiKey,
      rawKey,
    };
  }

  async listApiKeys(tenantId, options) {
    return apiKeyRepository.listByTenant(tenantId, options);
  }

  async revokeApiKey(id, tenantId) {
    return apiKeyRepository.update(id, tenantId, { is_active: false });
  }

  async verifyAndGetApiKey(rawKey) {
    const keyHash = this.hashKey(rawKey);
    const apiKey = await apiKeyRepository.findByHash(keyHash);
    
    if (!apiKey) return null;
    
    if (apiKey.expires_at && new Date() > new Date(apiKey.expires_at)) {
      return null;
    }

    return apiKey;
  }

  async updateLastUsed(id, tenantId) {
    return apiKeyRepository.update(id, tenantId, { last_used_at: new Date() });
  }
}

module.exports = new ApiKeyService();
