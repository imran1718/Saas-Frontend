const { error } = require('../utils/apiResponse');

const can = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return error(res, { code: 'FORBIDDEN', message: 'Access denied. No permissions found.' }, 403);
    }
    
    if (!req.user.permissions.includes(permissionKey)) {
      return error(res, { code: 'FORBIDDEN', message: `Access denied. Requires permission: ${permissionKey}` }, 403);
    }
    
    next();
  };
};

module.exports = can;
