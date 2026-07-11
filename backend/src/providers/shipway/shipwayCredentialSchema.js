'use strict';

const Joi = require('joi');

/**
 * Credentials schema for Shipway provider key.
 */
const shipwayCredentialSchema = Joi.object({
  username: Joi.string().required(),
  license_key: Joi.string().required(),
});

module.exports = shipwayCredentialSchema;
