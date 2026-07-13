const platformAuthService = require('../services/platformAuth.service');
const { success } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    const result = await platformAuthService.login(email, password, ipAddress);

    if (result.requires_2fa) {
      return success(res, result, 200);
    }

    // Set refresh token in HttpOnly cookie
    res.cookie('platform_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return success(res, {
      admin: result.admin,
      access_token: result.accessToken,
    }, 200);
  } catch (error) {
    next(error);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const adminId = req.platformAdmin.id; // from temp token middleware
    const ipAddress = req.ip;

    const result = await platformAuthService.verify2FA(adminId, token, ipAddress);

    res.cookie('platform_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, {
      admin: result.admin,
      access_token: result.accessToken,
    }, 200);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('platform_refresh_token');
    return success(res, null, 200);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const admin = req.platformAdmin;
    return success(res, admin, 200);
  } catch (error) {
    next(error);
  }
};

const listAdmins = async (req, res, next) => {
  try {
    const { PlatformAdmin } = require('../models');
    const admins = await PlatformAdmin.findAll({ attributes: ['id', 'name', 'email'] });
    return success(res, admins, 200);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.platform_refresh_token;
    const ipAddress = req.ip;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
    }

    const result = await platformAuthService.refresh(refreshToken, ipAddress);

    // Only set a new cookie when the token was actually rotated (not a concurrent grace-window call)
    if (result.refreshToken) {
      res.cookie('platform_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return success(res, {
      admin: result.admin,
      access_token: result.accessToken,
    }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  verify2FA,
  logout,
  getMe,
  listAdmins,
  refresh,
};
