const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const { loginLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

// Public
router.post(
  '/register',
  authValidator.validate(authValidator.schemas.register),
  authController.register
);

router.post(
  '/verify-email',
  authValidator.validate(authValidator.schemas.verifyEmail),
  authController.verifyEmail
);

router.post(
  '/login',
  loginLimiter,
  authValidator.validate(authValidator.schemas.login),
  authController.login
);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  authValidator.validate(authValidator.schemas.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authValidator.validate(authValidator.schemas.resetPassword),
  authController.resetPassword
);

// Refresh Token
router.post('/refresh', authController.refreshToken);

// 2FA - Public (but requires temp_token)
router.post(
  '/2fa/verify',
  loginLimiter,
  authValidator.validate(authValidator.schemas.verify2FA),
  authController.verify2FA
);

// Protected
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/me', authController.me);

router.post('/2fa/enable', authController.enable2FA);
router.post(
  '/2fa/confirm',
  authValidator.validate(authValidator.schemas.confirm2FA),
  authController.confirm2FA
);

module.exports = router;
