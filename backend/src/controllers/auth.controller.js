const authService = require('../services/auth.service');
const { success } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket?.remoteAddress;
    
    const result = await authService.login({ ...req.body, deviceInfo, ipAddress }, req);

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      // Don't send refresh_token in response body per best practices, 
      // but spec asks to return it. We will do both.
    }

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body.refresh_token;
    if (!token) {
      return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
    }

    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket?.remoteAddress;

    const result = await authService.refreshToken({ token, deviceInfo, ipAddress });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body.refresh_token;
    const userId = req.user?.id;
    
    await authService.logout(token, userId, req);
    
    res.clearCookie('refresh_token');
    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body, req);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body, req);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    // req.user is populated by auth.middleware
    return success(res, req.user);
  } catch (err) {
    next(err);
  }
};

const enable2FA = async (req, res, next) => {
  try {
    const result = await authService.enable2FA(req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const confirm2FA = async (req, res, next) => {
  try {
    const result = await authService.confirm2FA(req.user.id, req.body.otp, req);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket?.remoteAddress;
    
    const result = await authService.verify2FA({ ...req.body, deviceInfo, ipAddress }, req);

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  me,
  enable2FA,
  confirm2FA,
  verify2FA,
};
