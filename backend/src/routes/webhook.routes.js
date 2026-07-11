'use strict';

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { createLimiter } = require('../middlewares/rateLimiter.middleware');

// Webhook-specific rate limiter: 60 requests per minute per IP
// (separate from global limiter to be generous to courier servers)
const webhookLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  message: { success: false, data: null, error: { code: 'RATE_LIMIT', message: 'Too many webhook requests' } },
});

// Public — no auth required (courier servers authenticate via HMAC)
router.post('/:providerKey', webhookLimiter, webhookController.receiveWebhook);

module.exports = router;
