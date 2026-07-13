const express = require('express');
const walletRechargeController = require('../controllers/walletRecharge.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.post('/initiate', walletRechargeController.initiateRecharge);
router.post('/verify', walletRechargeController.verifyPayment);
router.get('/history', walletRechargeController.getRechargeHistory);

module.exports = router;

