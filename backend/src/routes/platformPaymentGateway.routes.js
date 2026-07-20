'use strict';
const express = require('express');
const router = express.Router();
const c = require('../controllers/platformPaymentGateway.controller');
const { isPlatformAdmin } = require('../middlewares/platformAuth.middleware');

router.use(isPlatformAdmin);

// Gateway configuration
router.get('/payment-gateways', c.listGateways);
router.post('/payment-gateways/:provider', c.saveCredentials);
router.patch('/payment-gateways/:provider/activate', c.activateGateway);
router.post('/payment-gateways/:provider/test', c.testGatewayConnection);
router.put('/payment-gateways/global-settings', c.updateGlobalSettings);

// Admin Wallet Recharge Transactions & Reconcile
router.get('/wallet/recharge-transactions', c.listRechargeTransactions);
router.post('/wallet/recharge-transactions/:id/reconcile', c.reconcileTransaction);

module.exports = router;
