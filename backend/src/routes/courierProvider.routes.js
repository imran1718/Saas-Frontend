'use strict';

const express = require('express');
const { isPlatformAdmin } = require('../middlewares/platformAuth.middleware');
const { canPlatform } = require('../middlewares/canPlatform.middleware');
const validate = require('../middlewares/validate.middleware');
const courierProviderController = require('../controllers/courierProvider.controller');
const {
  createProviderSchema,
  updateProviderSchema,
  grantAccessSchema,
} = require('../validators/courierProvider.validator');

const router = express.Router();

// Apply platform authentication and courier.manage authorization to all platform routes
router.use(isPlatformAdmin);
router.use(canPlatform('courier.manage'));

router.get('/', courierProviderController.list);
router.post('/', validate(createProviderSchema), courierProviderController.onboard);

router.get('/:id', courierProviderController.getById);
router.put('/:id', validate(updateProviderSchema), courierProviderController.update);
router.put('/:id/toggle', courierProviderController.toggle);

router.post('/:id/health-check', courierProviderController.healthCheck);
router.get('/:id/health-logs', courierProviderController.healthLogs);

router.get('/:id/circuit-breaker', courierProviderController.getCircuitBreakerStatus);
router.post('/:id/circuit-breaker/reset', courierProviderController.resetCircuitBreaker);

router.post('/:id/tenant-access', validate(grantAccessSchema), courierProviderController.grantAccess);
router.delete('/:id/tenant-access/:tenantId', courierProviderController.revokeAccess);

module.exports = router;
