const { error } = require('../utils/apiResponse');

const canPlatform = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.platformAdmin) {
      return error(res, { code: 'UNAUTHORIZED', message: 'Platform Admin context missing' }, 401);
    }

    if (req.platformAdmin.permissions.includes(requiredPermission)) {
      return next();
    }

    return error(res, { code: 'FORBIDDEN', message: 'Insufficient platform permissions' }, 403);
  };
};

module.exports = {
  canPlatform,
};
