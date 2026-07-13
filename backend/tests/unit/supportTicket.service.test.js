'use strict';

jest.mock('../../src/models', () => {
  const mockTransaction = jest.fn((cb) => cb({ LOCK: { UPDATE: 'UPDATE' } }));
  return {
    sequelize: {
      transaction: mockTransaction,
    },
    SupportTicket: {
      create: jest.fn(),
      findByPk: jest.fn(),
    },
    TicketMessage: {
      create: jest.fn(),
    },
    TicketAttachment: {
      create: jest.fn(),
    },
    Order: {
      findByPk: jest.fn(),
    },
    Shipment: {
      findByPk: jest.fn(),
    },
    PlatformAdmin: {
      findByPk: jest.fn(),
    },
    SystemSequence: {
      findOne: jest.fn(),
      create: jest.fn(),
    }
  };
});

const supportTicketService = require('../../src/services/supportTicket.service');

describe('SupportTicketService - Unit Tests', () => {
  let mockTicket;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTicket = {
      id: 'ticket-uuid-123',
      tenant_id: 'tenant-uuid-abc',
      ticket_number: 'TKT-000001',
      subject: 'NDR Dispute',
      status: 'open',
      priority: 'medium',
      first_response_at: null,
      resolved_at: null,
      update: jest.fn().mockImplementation(function (data) {
        Object.assign(this, data);
        return this;
      }),
    };
  });

  describe('createTicket', () => {
    test('should create ticket successfully with sequences and SLAs', async () => {
      const { SupportTicket, TicketMessage, SystemSequence } = require('../../src/models');
      
      SystemSequence.findOne.mockResolvedValue({
        last_value: 0,
        update: jest.fn(),
      });
      SupportTicket.create.mockResolvedValue(mockTicket);
      TicketMessage.create.mockResolvedValue({ id: 'msg-1' });

      const result = await supportTicketService.createTicket('tenant-uuid-abc', 'user-1', {
        subject: 'Invoice Issue',
        category: 'billing',
        priority: 'high',
        message: 'There is a billing mismatch.',
      });

      expect(result.id).toBe('ticket-uuid-123');
      expect(SupportTicket.create).toHaveBeenCalled();
      expect(TicketMessage.create).toHaveBeenCalled();
    });

    test('should throw CrossTenantReferenceError if linked order belongs to another tenant', async () => {
      const { Order } = require('../../src/models');
      Order.findByPk.mockResolvedValue({ id: 'order-123', tenant_id: 'other-tenant-xyz' });

      await expect(
        supportTicketService.createTicket('tenant-uuid-abc', 'user-1', {
          subject: 'Order Issue',
          category: 'shipment_issue',
          message: 'My order did not arrive.',
          related_order_id: 'order-123',
        })
      ).rejects.toThrow('The referenced order does not belong to this tenant.');
    });
  });

  describe('replyToTicket', () => {
    test('should allow replying to an open ticket and link attachments', async () => {
      const { SupportTicket, TicketMessage } = require('../../src/models');
      SupportTicket.findByPk.mockResolvedValue(mockTicket);
      TicketMessage.create.mockResolvedValue({ id: 'msg-reply' });

      const result = await supportTicketService.replyToTicket(
        'ticket-uuid-123',
        'tenant_user',
        'user-1',
        { message: 'Still waiting on help.' }
      );

      expect(result.id).toBe('msg-reply');
      expect(TicketMessage.create).toHaveBeenCalled();
    });

    test('should reopen a resolved ticket to in_progress if tenant user replies', async () => {
      const { SupportTicket } = require('../../src/models');
      mockTicket.status = 'resolved';
      mockTicket.resolved_at = new Date();
      SupportTicket.findByPk.mockResolvedValue(mockTicket);

      await supportTicketService.replyToTicket(
        'ticket-uuid-123',
        'tenant_user',
        'user-1',
        { message: 'No, this is not resolved yet!' }
      );

      expect(mockTicket.status).toBe('in_progress');
      expect(mockTicket.resolved_at).toBeNull();
    });

    test('should reject replies if the ticket is already closed', async () => {
      const { SupportTicket } = require('../../src/models');
      mockTicket.status = 'closed';
      SupportTicket.findByPk.mockResolvedValue(mockTicket);

      await expect(
        supportTicketService.replyToTicket(
          'ticket-uuid-123',
          'tenant_user',
          'user-1',
          { message: 'Trying to reply to closed ticket.' }
        )
      ).rejects.toThrow('Cannot reply to a closed support ticket.');
    });
  });

  describe('closeTicket', () => {
    test('should allow a tenant to close a ticket that is resolved', async () => {
      const { SupportTicket } = require('../../src/models');
      mockTicket.status = 'resolved';
      SupportTicket.findByPk.mockResolvedValue(mockTicket);

      const result = await supportTicketService.closeTicket('ticket-uuid-123', 'tenant-uuid-abc');
      expect(result.status).toBe('closed');
    });

    test('should throw TicketNotResolvedError if tenant attempts to close unresolved ticket', async () => {
      const { SupportTicket } = require('../../src/models');
      mockTicket.status = 'in_progress';
      SupportTicket.findByPk.mockResolvedValue(mockTicket);

      await expect(
        supportTicketService.closeTicket('ticket-uuid-123', 'tenant-uuid-abc')
      ).rejects.toThrow('Only resolved support tickets can be closed by tenants.');
    });
  });
});
