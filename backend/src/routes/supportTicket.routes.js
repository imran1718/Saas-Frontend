'use strict';

const express = require('express');
const supportTicketController = require('../controllers/supportTicket.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const can = require('../middlewares/can.middleware');
const validate = require('../middlewares/validate.middleware');
const { createTicketSchema, replyTicketSchema } = require('../validators/supportTicket.validator');

const router = express.Router();

router.use(authenticate);

router.get('/tickets', can('support.view'), supportTicketController.listTickets);
router.get('/tickets/:id', can('support.view'), supportTicketController.getTicketDetail);
router.post('/tickets', can('support.create'), validate(createTicketSchema), supportTicketController.createTicket);
router.post('/tickets/:id/reply', can('support.create'), validate(replyTicketSchema), supportTicketController.replyToTicket);
router.put('/tickets/:id/close', can('support.create'), supportTicketController.closeTicket);

module.exports = router;
