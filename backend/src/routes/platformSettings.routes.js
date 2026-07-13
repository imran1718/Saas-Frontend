'use strict';

const express = require('express');
const router = express.Router();
const { isPlatformAdmin } = require('../middlewares/platformAuth.middleware');
const { canPlatform } = require('../middlewares/canPlatform.middleware');
const validate = require('../middlewares/validate.middleware');
const { updatePlatformSettingSchema } = require('../validators/settings.validator');
const { getPlatformSettings, updatePlatformSetting } = require('../controllers/platformSettings.controller');

router.use(isPlatformAdmin);

router.get('/', canPlatform('platform_settings.manage'), getPlatformSettings);
router.put('/:key', canPlatform('platform_settings.manage'), validate(updatePlatformSettingSchema), updatePlatformSetting);

module.exports = router;
