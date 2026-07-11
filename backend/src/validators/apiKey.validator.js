const Joi = require('joi');

const VALID_SCOPES = [
  'orders.read',
  'orders.write',
  'shipments.read',
  'shipments.write',
  'tracking.read'
];

const createApiKeySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  scopes: Joi.array().items(Joi.string().valid(...VALID_SCOPES)).required().min(1),
  expires_at: Joi.date().iso().allow(null),
});

module.exports = {
  createApiKeySchema,
};
