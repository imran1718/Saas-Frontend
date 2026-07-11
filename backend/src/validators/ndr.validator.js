'use strict';

const Joi = require('joi');

const takeNdrActionSchema = Joi.object({
  action_type: Joi.string().valid('reattempt', 'update_address', 'update_phone', 'mark_rto', 'call_customer', 'no_action').required(),
  notes: Joi.string().max(500).allow('', null),
  updated_address_line1: Joi.string().max(255).allow('', null),
  updated_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow('', null), // E.164 pattern
});

const bulkNdrActionSchema = Joi.object({
  ndr_ids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  action_type: Joi.string().valid('reattempt', 'update_address', 'update_phone', 'mark_rto', 'call_customer', 'no_action').required(),
  notes: Joi.string().max(500).allow('', null),
  updated_address_line1: Joi.string().max(255).allow('', null),
  updated_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow('', null),
});

const updateRtoStatusSchema = Joi.object({
  status: Joi.string().valid('rto_initiated', 'rto_in_transit', 'rto_delivered', 'rto_lost').required(),
  notes: Joi.string().max(500).allow('', null),
  rto_awb_number: Joi.string().max(100).allow('', null),
});

module.exports = {
  takeNdrActionSchema,
  bulkNdrActionSchema,
  updateRtoStatusSchema,
};
