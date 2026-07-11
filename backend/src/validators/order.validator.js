const Joi = require('joi');

const orderItemSchema = Joi.object({
  product_name: Joi.string().required().max(200).messages({
    'any.required': 'Product name is required',
  }),
  sku: Joi.string().optional().allow('', null).max(100),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
  }),
  unit_price: Joi.number().min(0).required().messages({
    'number.min': 'Unit price must be positive',
  }),
});

const createOrderSchema = Joi.object({
  order_reference: Joi.string().required().min(3).max(100).pattern(/^[a-zA-Z0-9\-_]+$/).messages({
    'string.pattern.base': 'Order reference must be alphanumeric with hyphens/underscores only',
  }),
  pickup_address_id: Joi.string().uuid().required(),
  customer_name: Joi.string().required().max(100),
  customer_phone: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/).messages({
    'string.pattern.base': 'Customer phone must be in valid E.164 format',
  }),
  customer_email: Joi.string().email().optional().allow('', null).max(150),
  shipping_address_line1: Joi.string().required().max(255),
  shipping_address_line2: Joi.string().optional().allow('', null).max(255),
  shipping_city: Joi.string().required().max(100),
  shipping_state: Joi.string().required().max(100),
  shipping_pincode: Joi.string().required().pattern(/^[1-9][0-9]{5}$/).messages({
    'string.pattern.base': 'Shipping pincode must be a 6-digit Indian PIN code',
  }),
  shipping_country: Joi.string().optional().default('India').max(100),
  order_value: Joi.number().min(0).optional(),
  payment_mode: Joi.string().valid('prepaid', 'cod').required(),
  cod_amount: Joi.number().min(0).optional().when('payment_mode', {
    is: 'cod',
    then: Joi.required(),
  }),
  weight_kg: Joi.number().positive().max(50).precision(3).required().messages({
    'number.positive': 'Weight must be greater than 0 kg',
    'number.max': 'Weight exceeds maximum limit of 50 kg',
  }),
  length_cm: Joi.number().positive().required(),
  width_cm: Joi.number().positive().required(),
  height_cm: Joi.number().positive().required(),
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'At least one item line is required',
  }),
});

const updateOrderSchema = Joi.object({
  order_reference: Joi.string().min(3).max(100).pattern(/^[a-zA-Z0-9\-_]+$/).optional(),
  pickup_address_id: Joi.string().uuid().optional(),
  customer_name: Joi.string().max(100).optional(),
  customer_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  customer_email: Joi.string().email().optional().allow('', null).max(150),
  shipping_address_line1: Joi.string().max(255).optional(),
  shipping_address_line2: Joi.string().optional().allow('', null).max(255),
  shipping_city: Joi.string().max(100).optional(),
  shipping_state: Joi.string().max(100).optional(),
  shipping_pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
  shipping_country: Joi.string().max(100).optional(),
  order_value: Joi.number().min(0).optional(),
  payment_mode: Joi.string().valid('prepaid', 'cod').optional(),
  cod_amount: Joi.number().min(0).optional(),
  weight_kg: Joi.number().positive().max(50).precision(3).optional(),
  length_cm: Joi.number().positive().optional(),
  width_cm: Joi.number().positive().optional(),
  height_cm: Joi.number().positive().optional(),
  items: Joi.array().items(orderItemSchema).min(1).optional(),
});

const queryOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  search: Joi.string().optional().allow(''),
  status: Joi.string().valid('pending', 'processing', 'ready_to_ship', 'cancelled').optional(),
  payment_mode: Joi.string().valid('prepaid', 'cod').optional(),
  pickup_address_id: Joi.string().uuid().optional(),
  date_from: Joi.string().isoDate().optional(),
  date_to: Joi.string().isoDate().optional(),
  source: Joi.string().valid('manual', 'bulk_import', 'api').optional(),
  sort: Joi.string().optional(),
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  queryOrdersSchema,
};
