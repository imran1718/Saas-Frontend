'use strict';

const express = require('express');
const router = express.Router();
const weightDisputeController = require('../controllers/weightDispute.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isPlatformAdmin } = require('../middlewares/platformAuth.middleware');
const { canPlatform } = require('../middlewares/canPlatform.middleware');

// Seller routes
router.post('/', authenticate, weightDisputeController.fileDispute);
router.get('/', authenticate, weightDisputeController.listMyDisputes);
router.get('/:id', authenticate, weightDisputeController.getMyDispute);

// Admin routes
router.get('/platform/all', isPlatformAdmin, canPlatform('admin.view'), weightDisputeController.listAllDisputes);
router.put('/platform/:id/resolve', isPlatformAdmin, canPlatform('platform_settings.manage'), weightDisputeController.resolveDispute);

module.exports = router;
