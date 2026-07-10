const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(error);
  }
  req.body = value;
  next();
};

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const schemas = {
  register: Joi.object({
    company_name: Joi.string().min(2).max(150).required(),
    subdomain: Joi.string().pattern(/^[a-z0-9-]{3,63}$/).invalid('www', 'api', 'admin', 'app').required(),
    name: Joi.string().max(100).required(),
    email: Joi.string().email().max(150).required(),
    password: Joi.string().pattern(passwordPattern).required().messages({
      'string.pattern.base': 'Password must be at least 8 characters, contain 1 uppercase, 1 number, and 1 special character.',
    }),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null).messages({
      'string.pattern.base': 'Phone number must be in E.164 format.',
    }),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    subdomain: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
    subdomain: Joi.string().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    new_password: Joi.string().pattern(passwordPattern).required().messages({
      'string.pattern.base': 'Password must be at least 8 characters, contain 1 uppercase, 1 number, and 1 special character.',
    }),
  }),

  confirm2FA: Joi.object({
    otp: Joi.string().length(6).required(),
  }),

  verify2FA: Joi.object({
    temp_token: Joi.string().required(),
    otp: Joi.string().length(6).required(),
  }),
};

module.exports = {
  validate,
  schemas,
};
