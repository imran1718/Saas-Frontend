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
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return success(res, {
      admin: result.admin,
      accessToken: result.accessToken,
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
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, {
      admin: result.admin,
      accessToken: result.accessToken,
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

module.exports = {
  login,
  verify2FA,
  logout,
  getMe,
};
