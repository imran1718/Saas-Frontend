const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { createOrderSchema, updateOrderSchema, queryOrdersSchema } = require('../validators/order.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const can = require('../middlewares/can.middleware');

router.use(authenticate);

// Orders CRUD and Dashboard summary Routes
router.get('/', can('order.view'), validate(queryOrdersSchema, 'query'), orderController.getOrders);
router.get('/summary', can('order.view'), orderController.getSummary);
router.post('/', can('order.create'), validate(createOrderSchema, 'body'), orderController.createOrder);

router.get('/:id', can('order.view'), orderController.getOrderById);
router.put('/:id', can('order.update'), validate(updateOrderSchema, 'body'), orderController.updateOrder);
router.put('/:id/status', can('order.update'), orderController.changeStatus);
router.delete('/:id', can('order.delete'), orderController.cancelOrder);

module.exports = router;
