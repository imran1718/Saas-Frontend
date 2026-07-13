'use strict';

const express = require('express');
const router = express.Router();
const codRemittanceController = require('../controllers/codRemittance.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isPlatformAdmin } = require('../middlewares/platformAuth.middleware');
const { canPlatform } = require('../middlewares/canPlatform.middleware');

// Seller Panel routes
router.get('/wallet/cod-remittances', authenticate, codRemittanceController.listBatches);
router.get('/wallet/cod-remittances/:id', authenticate, codRemittanceController.getBatchDetails);

// Platform Admin / Finance routes
router.get('/platform/finance/cod-remittances', isPlatformAdmin, canPlatform('admin.view'), codRemittanceController.listBatchesAdmin);
router.post('/platform/finance/cod-remittances', isPlatformAdmin, canPlatform('platform_settings.manage'), codRemittanceController.createBatchAdmin);
router.put('/platform/finance/cod-remittances/:id/process', isPlatformAdmin, canPlatform('platform_settings.manage'), codRemittanceController.processBatchAdmin);

module.exports = router;
