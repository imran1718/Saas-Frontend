const { error } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { AuthError, ConflictError } = require('../services/auth.service');
const { AuthenticationError, ForbiddenError, NotFoundError } = require('../utils/errors');
const { ValidationError } = require('joi');

const errorHandler = (err, req, res, next) => {
  logger.error(`[ErrorHandler] ${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AuthError || err instanceof AuthenticationError) {
    return error(res, { code: err.code || 'UNAUTHORIZED', message: err.message }, 401);
  }

  if (err instanceof ForbiddenError) {
    return error(res, { code: err.code, message: err.message }, 403);
  }

  if (err instanceof NotFoundError) {
    return error(res, { code: err.code, message: err.message }, 404);
  }

  if (err instanceof ConflictError) {
    return error(res, { code: err.code, message: err.message }, 409);
  }

  if (err instanceof ValidationError) {
    const fields = {};
    err.details.forEach((detail) => {
      fields[detail.path.join('.')] = detail.message;
    });
    return error(res, { code: 'VALIDATION_ERROR', message: 'Invalid input', fields }, 422);
  }

  // Handle Sequelize Unique Constraint Errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return error(res, { code: 'CONFLICT', message: 'Resource already exists' }, 409);
  }

  // Generic 500
  return error(res, { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, 500);
};

module.exports = errorHandler;
