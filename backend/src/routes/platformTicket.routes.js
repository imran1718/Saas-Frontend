'use strict';

const express = require('express');
const platformTicketController = require('../controllers/platformTicket.controller');
const { isPlatformAdmin } = require('../middlewares/platformAuth.middleware');
const { canPlatform } = require('../middlewares/canPlatform.middleware');
const validate = require('../middlewares/validate.middleware');
const { 
  replyTicketSchema, 
  assignTicketSchema, 
  updateStatusSchema 
} = require('../validators/supportTicket.validator');

const router = express.Router();

router.use(isPlatformAdmin);

router.get('/tickets', canPlatform('ticket.view'), platformTicketController.listTickets);
router.get('/tickets/summary', canPlatform('ticket.view'), platformTicketController.getSummary);
router.get('/tickets/:id', canPlatform('ticket.view'), platformTicketController.getTicketDetail);

router.post('/tickets/:id/reply', canPlatform('ticket.manage'), validate(replyTicketSchema), platformTicketController.replyToTicket);
router.post('/tickets/:id/internal-note', canPlatform('ticket.manage'), validate(replyTicketSchema), platformTicketController.addInternalNote);
router.put('/tickets/:id/assign', canPlatform('ticket.manage'), validate(assignTicketSchema), platformTicketController.assignTicket);
router.put('/tickets/:id/status', canPlatform('ticket.manage'), validate(updateStatusSchema), platformTicketController.updateStatus);

module.exports = router;
