'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const can = require('../middlewares/can.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateTenantSettingsSchema } = require('../validators/settings.validator');
const { getSettings, updateSettings } = require('../controllers/tenantSettings.controller');

router.get('/', authenticate, can('settings.manage'), getSettings);
router.put('/', authenticate, can('settings.manage'), validate(updateTenantSettingsSchema), updateSettings);

module.exports = router;
