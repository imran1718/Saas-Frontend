'use strict';
const express = require('express');
const router = express.Router();
const c = require('../controllers/paymentWebhook.controller');

// Public server-to-server webhook endpoint (no auth middleware, signature verified internally)
router.post('/payments/:provider', c.handlePaymentWebhook);

module.exports = router;
