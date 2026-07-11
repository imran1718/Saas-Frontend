'use strict';

const express = require('express');
const { apiKeyAuth, requireScope } = require('../middlewares/apiKeyAuth.middleware');
const apiKeyRateLimiter = require('../middlewares/apiKeyRateLimit.middleware');

const router = express.Router();

// Apply rate limiting to all public endpoints
router.use(apiKeyRateLimiter);

// Protect with API Key Auth
router.use(...apiKeyAuth);

router.get('/orders', requireScope('orders.read'), (req, res) => {
  res.json({
    success: true,
    message: 'Orders retrieved successfully via API Key!',
    tenant_id: req.tenant_id,
  });
});

router.post('/orders', requireScope('orders.write'), (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Order created successfully via API Key!',
    tenant_id: req.tenant_id,
  });
});

router.get('/shipments', requireScope('shipments.read'), (req, res) => {
  res.json({
    success: true,
    message: 'Shipments retrieved successfully via API Key!',
    tenant_id: req.tenant_id,
  });
});

module.exports = router;
