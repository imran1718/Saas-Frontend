/**
 * Standardized API response helpers.
 * All responses follow the shape: { success, data, error }
 */

const success = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
};

const error = (res, { code = 'INTERNAL_ERROR', message = 'An error occurred', fields = undefined } = {}, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
    },
  });
};

module.exports = { success, error };
