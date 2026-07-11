'use strict';

const express = require('express');
const router = express.Router();
const rechargeController = require('../controllers/recharge.controller');

router.post('/webhooks/razorpay', rechargeController.webhook);

module.exports = router;
