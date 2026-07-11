'use strict';

const Joi = require('joi');

/**
 * Credentials schema for Delhivery provider key.
 */
const delhiveryCredentialSchema = Joi.object({
  api_token: Joi.string().required(),
  client_name: Joi.string().required(),
});

module.exports = delhiveryCredentialSchema;
