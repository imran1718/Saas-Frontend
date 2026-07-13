const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

const SHOPIFY_API_VERSION = '2024-04';

const getApiBase = (storeUrl) => {
  const base = storeUrl.replace(/\/$/, '');
  const host = base.includes('myshopify.com') ? base : `${base}.myshopify.com`;
  return `https://${host}/admin/api/${SHOPIFY_API_VERSION}`;
};

const shopifyClient = (storeUrl, accessToken) =>
  axios.create({
    baseURL: getApiBase(storeUrl),
    headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
    timeout: 15000,
  });

/**
 * Validate Shopify credentials by fetching shop info.
 */
const validateCredentials = async (storeUrl, accessToken) => {
  try {
    const client = shopifyClient(storeUrl, accessToken);
    const { data } = await client.get('/shop.json');
    return { success: true, storeName: data.shop.name };
  } catch (err) {
    const msg = err.response?.data?.errors || err.message;
    return { success: false, error: String(msg) };
  }
};

/**
 * Register Shopify webhooks for order events.
 */
const registerWebhooks = async (connection, accessToken) => {
  const client = shopifyClient(connection.store_url, accessToken);
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
  const webhookBase = `${appBaseUrl}/api/webhooks/shopify/${connection.id}`;
  const topics = ['orders/create', 'orders/updated', 'orders/cancelled'];

  for (const topic of topics) {
    try {
      await client.post('/webhooks.json', {
        webhook: {
          topic,
          address: `${webhookBase}?topic=${encodeURIComponent(topic)}`,
          format: 'json',
        },
      });
      logger.info(`[Shopify] Registered webhook ${topic} for connection ${connection.id}`);
    } catch (err) {
      logger.warn(`[Shopify] Failed to register ${topic}: ${err.response?.data?.errors || err.message}`);
    }
  }
};

/**
 * Deregister all webhooks for a connection (best effort).
 */
const deregisterWebhooks = async (connection, accessToken) => {
  try {
    const client = shopifyClient(connection.store_url, accessToken);
    const { data } = await client.get('/webhooks.json', { params: { limit: 250 } });
    const appBase = `${process.env.APP_BASE_URL}/api/webhooks/shopify/${connection.id}`;
    const ours = (data.webhooks || []).filter(w => w.address.startsWith(appBase));
    for (const w of ours) {
      await client.delete(`/webhooks/${w.id}.json`);
    }
  } catch (err) {
    logger.warn(`[Shopify] Deregister webhooks failed: ${err.message}`);
  }
};

/**
 * Fetch orders from Shopify since a given date.
 */
const fetchOrdersSince = async (connection, accessToken, sinceDate) => {
  const client = shopifyClient(connection.store_url, accessToken);
  const orders = [];
  let pageInfo = null;
  const params = {
    limit: 250,
    status: 'any',
    updated_at_min: sinceDate ? new Date(sinceDate).toISOString() : undefined,
    fields: 'id,name,line_items,shipping_address,financial_status,total_weight,created_at,updated_at',
  };

  do {
    if (pageInfo) params.page_info = pageInfo;
    const { data, headers } = await client.get('/orders.json', { params });
    orders.push(...(data.orders || []));
    // Shopify cursor pagination
    const linkHeader = headers.link || '';
    const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
    pageInfo = nextMatch ? nextMatch[1] : null;
  } while (pageInfo);

  return orders;
};

/**
 * Verify inbound Shopify webhook signature.
 */
const verifyWebhookSignature = (rawBody, hmacHeader, webhookSecret) => {
  const computed = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmacHeader));
  } catch { return false; }
};

module.exports = { validateCredentials, registerWebhooks, deregisterWebhooks, fetchOrdersSince, verifyWebhookSignature };
