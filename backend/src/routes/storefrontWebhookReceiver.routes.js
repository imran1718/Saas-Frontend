const express = require('express');
const shopifyConnectorService = require('../services/shopifyConnector.service');
const woocommerceConnectorService = require('../services/woocommerceConnector.service');
const storefrontConnectionRepo = require('../repositories/storefrontConnection.repository');
const logger = require('../utils/logger');

const router = express.Router();

const processStoreWebhook = async (req, res, connection, platform, topic) => {
  res.status(200).json({ received: true });
  const payload = req.body;
  const { Queue } = require('bullmq');
  const { getRedisClient } = require('../config/redis.config');
  const queue = new Queue('storefront-webhook-process', { connection: getRedisClient() });
  await queue.add('store-webhook', { connectionId: connection.id, platform, topic, payload });
};

// Shopify inbound webhook
router.post('/shopify/:connectionId', express.raw({ type: '*/*' }), async (req, res, next) => {
  try {
    const connection = await storefrontConnectionRepo.findById(req.params.connectionId);
    if (!connection) return res.status(404).json({ error: 'Connection not found' });

    const rawBody = req.body;
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    if (!shopifyConnectorService.verifyWebhookSignature(rawBody, hmacHeader, connection.webhook_secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const topic = req.query.topic || req.headers['x-shopify-topic'];
    await processStoreWebhook(req, res, connection, 'shopify', topic, JSON.parse(rawBody.toString()));
  } catch (err) { next(err); }
});

// WooCommerce inbound webhook
router.post('/woocommerce/:connectionId', express.raw({ type: '*/*' }), async (req, res, next) => {
  try {
    const connection = await storefrontConnectionRepo.findById(req.params.connectionId);
    if (!connection) return res.status(404).json({ error: 'Connection not found' });

    const rawBody = req.body;
    const sigHeader = req.headers['x-wc-webhook-signature'];
    if (!woocommerceConnectorService.verifyWebhookSignature(rawBody, sigHeader, connection.webhook_secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const topic = req.query.topic || req.headers['x-wc-webhook-topic'];
    await processStoreWebhook(req, res, connection, 'woocommerce', topic, JSON.parse(rawBody.toString()));
  } catch (err) { next(err); }
});

module.exports = router;
