const express = require('express');
const platformAuthController = require('../controllers/platformAuth.controller');
const { isPlatformAdmin, isPlatformAdminTemp } = require('../middlewares/platformAuth.middleware');
const { validateLogin, validateVerify2FA } = require('../validators/platformAuth.validator');

const router = express.Router();

router.post('/login', validateLogin, platformAuthController.login);
router.post('/2fa/verify', isPlatformAdminTemp, validateVerify2FA, platformAuthController.verify2FA); // Requires temp token
router.post('/logout', platformAuthController.logout);
router.post('/refresh', platformAuthController.refresh);

router.get('/me', isPlatformAdmin, platformAuthController.getMe);
router.get('/admins', isPlatformAdmin, platformAuthController.listAdmins);

module.exports = router;
