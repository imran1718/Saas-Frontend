'use strict';

const Joi = require('joi');

const createShipmentSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  courier_provider_id: Joi.string().uuid().required(),
  service_type: Joi.string().valid('surface', 'air', 'express').required(),
  quoted_rate: Joi.number().positive().precision(2).required(),
});

module.exports = {
  createShipmentSchema,
};
