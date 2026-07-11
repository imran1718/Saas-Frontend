'use strict';

const express = require('express');
const router = express.Router();
const publicTrackingController = require('../controllers/publicTracking.controller');
const { createLimiter } = require('../middlewares/rateLimiter.middleware');

// Public — 20 requests per minute per IP
const publicTrackLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: { success: false, data: null, error: { code: 'RATE_LIMIT', message: 'Too many tracking requests, please slow down.' } },
});

router.get('/:awbNumber', publicTrackLimiter, publicTrackingController.getPublicTracking);

module.exports = router;
