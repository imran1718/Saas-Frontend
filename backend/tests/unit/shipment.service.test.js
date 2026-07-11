'use strict';

// Mock the database configuration file before requiring anything
jest.mock('../../src/config/db.config', () => {
  return {
    transaction: jest.fn(async (fn) => fn({ LOCK: { UPDATE: 'UPDATE' } })),
    sequelize: {
      fn: jest.fn(),
      col: jest.fn(),
    },
  };
});

// Mock the models manually to prevent auto-requiring that triggers DB connection define calls
jest.mock('../../src/models', () => {
  const mockOrderFindOne = jest.fn();
  const mockQuoteFindOne = jest.fn();
  const mockProviderFindByPk = jest.fn();
  const mockShipmentCreate = jest.fn();
  const mockShipmentFindOne = jest.fn();
  const mockShipmentFindAll = jest.fn();

  const mockProviderScope = jest.fn(() => ({
    findByPk: mockProviderFindByPk,
  }));

  const mockWallet = {
    balance: '1000.00',
    save: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
  };

  return {
    Order: {
      findOne: mockOrderFindOne,
    },
    ShipmentRateQuote: {
      findOne: mockQuoteFindOne,
      bulkCreate: jest.fn().mockResolvedValue(true),
    },
    CourierProvider: {
      scope: mockProviderScope,
    },
    Shipment: {
      create: mockShipmentCreate,
      findOne: mockShipmentFindOne,
      findAll: mockShipmentFindAll,
    },
    Wallet: {
      findOne: jest.fn().mockResolvedValue(mockWallet),
      create: jest.fn().mockResolvedValue({}),
    },
    WalletTransaction: {
      create: jest.fn().mockResolvedValue({}),
    },
    TenantSubscription: {
      findOne: jest.fn().mockResolvedValue({
        plan: {
          courier_access_tier: 'all',
          max_orders_per_month: 1000,
        },
      }),
    },
    SubscriptionPlan: {
      findOne: jest.fn().mockResolvedValue({}),
    },
    PlanUsageTracking: {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ orders_count: 0 }),
    },
  };
});

const shipmentService = require('../../src/services/shipment.service');
const { Order, ShipmentRateQuote, CourierProvider, Shipment } = require('../../src/models');
const {
  OrderNotShippableError,
  RateQuoteExpiredError,
  ProviderShipmentCreationFailedError,
  ShipmentNotCancellableError,
} = require('../../src/utils/errors');
const shipmentStatusService = require('../../src/services/shipmentStatus.service');
const orderStatusService = require('../../src/services/orderStatus.service');
const ProviderFactory = require('../../src/providers/ProviderFactory');
const fileUploadService = require('../../src/services/fileUpload.service');
const auditService = require('../../src/services/audit.service');

jest.mock('../../src/services/shipmentStatus.service');
jest.mock('../../src/services/orderStatus.service');
jest.mock('../../src/providers/ProviderFactory');
jest.mock('../../src/services/fileUpload.service');
jest.mock('../../src/services/audit.service');
jest.mock('../../src/services/providerCredential.service', () => ({
  decrypt: jest.fn().mockReturnValue({ apiKey: 'test-api-key' }),
  encrypt: jest.fn().mockReturnValue('mock-encrypted-blob'),
}));

describe('ShipmentService - Unit Tests', () => {
  let mockOrder;
  let mockQuote;
  let mockProvider;
  let mockAdapter;
  let mockShipment;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrder = {
      id: 'order-123',
      order_reference: 'REF-123',
      status: 'ready_to_ship',
      weight_kg: '1.50',
      order_value: '500.00',
      payment_mode: 'prepaid',
      cod_amount: null,
      pickup_address_id: 'pickup-123',
      pickupAddress: { pincode: '400001' },
      update: jest.fn().mockResolvedValue(true),
    };

    mockQuote = {
      id: 'quote-123',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10m in future
      price: '50.00',
      cod_charge: '0.00',
    };

    mockProvider = {
      id: 'provider-123',
      provider_key: 'mock_provider',
      display_name: 'Mock Provider',
      is_active: true,
      credentials_encrypted: 'some-encrypted-blob',
      config: {},
    };

    mockAdapter = {
      createShipment: jest.fn().mockResolvedValue({
        success: true,
        data: {
          awbNumber: 'MOCK-AWB-123',
          courierShipmentId: 'COURIER-123',
          labelUrl: 'http://mock.com/label.pdf',
          estimatedPickupDate: '2026-07-12',
        },
        providerRawResponse: { raw: true },
      }),
      cancelShipment: jest.fn().mockResolvedValue({
        success: true,
        data: {},
      }),
    };

    mockShipment = {
      id: 'shipment-123',
      status: 'awb_generated',
      awb_number: 'MOCK-AWB-123',
      order_id: 'order-123',
      courier_provider_id: 'provider-123',
      selected_rate: 50.00,
      update: jest.fn().mockResolvedValue(true),
      order: mockOrder,
    };

    Order.findOne.mockResolvedValue(mockOrder);
    ShipmentRateQuote.findOne.mockResolvedValue(mockQuote);
    
    // Setup model scoped query mock
    const scopeMock = CourierProvider.scope();
    scopeMock.findByPk.mockResolvedValue(mockProvider);

    ProviderFactory.getAdapter.mockReturnValue(mockAdapter);
    Shipment.create.mockResolvedValue(mockShipment);
    Shipment.findOne.mockResolvedValue(mockShipment);
    fileUploadService.uploadFile.mockResolvedValue('http://local/label.pdf');
  });

  describe('createShipment', () => {
    it('should successfully book shipment and update order to shipped', async () => {
      const result = await shipmentService.createShipment({
        order_id: 'order-123',
        courier_provider_id: 'provider-123',
        service_type: 'express',
        quoted_rate: 50.00,
      }, 'tenant-123', 'user-123');

      expect(result).toBe(mockShipment);
      expect(Order.findOne).toHaveBeenCalled();
      expect(ShipmentRateQuote.findOne).toHaveBeenCalled();
      expect(mockAdapter.createShipment).toHaveBeenCalled();
      expect(mockOrder.update).toHaveBeenCalledWith({ status: 'shipped' }, { transaction: expect.any(Object) });
      expect(orderStatusService.logHistory).toHaveBeenCalledWith(
        'order-123',
        'ready_to_ship',
        'shipped',
        'user-123',
        expect.any(String),
        expect.any(Object)
      );
      expect(shipmentStatusService.logHistory).toHaveBeenCalledWith(
        expect.any(String),
        null,
        'created',
        'system',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should fail if order is not in ready_to_ship status', async () => {
      mockOrder.status = 'processing';

      await expect(
        shipmentService.createShipment({
          order_id: 'order-123',
          courier_provider_id: 'provider-123',
          service_type: 'express',
          quoted_rate: 50.00,
        }, 'tenant-123', 'user-123')
      ).rejects.toThrow(OrderNotShippableError);

      expect(mockAdapter.createShipment).not.toHaveBeenCalled();
    });

    it('should fail if rate quote is expired', async () => {
      mockQuote.expires_at = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5m in past

      await expect(
        shipmentService.createShipment({
          order_id: 'order-123',
          courier_provider_id: 'provider-123',
          service_type: 'express',
          quoted_rate: 50.00,
        }, 'tenant-123', 'user-123')
      ).rejects.toThrow(RateQuoteExpiredError);

      expect(mockAdapter.createShipment).not.toHaveBeenCalled();
    });

    it('should fail if price tampering is detected (no quote matches)', async () => {
      ShipmentRateQuote.findOne.mockResolvedValue(null);

      await expect(
        shipmentService.createShipment({
          order_id: 'order-123',
          courier_provider_id: 'provider-123',
          service_type: 'express',
          quoted_rate: 999.00, // Tampered price
        }, 'tenant-123', 'user-123')
      ).rejects.toThrow(RateQuoteExpiredError);
    });

    it('should propagate adapter errors and block DB writes', async () => {
      mockAdapter.createShipment.mockResolvedValue({
        success: false,
        error: { message: 'Carrier weight exceeded' },
      });

      await expect(
        shipmentService.createShipment({
          order_id: 'order-123',
          courier_provider_id: 'provider-123',
          service_type: 'express',
          quoted_rate: 50.00,
        }, 'tenant-123', 'user-123')
      ).rejects.toThrow(ProviderShipmentCreationFailedError);

      expect(Shipment.create).not.toHaveBeenCalled();
      expect(mockOrder.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelShipment', () => {
    it('should successfully cancel pre-pickup shipment and revert order status', async () => {
      const result = await shipmentService.cancelShipment('shipment-123', 'tenant-123', 'user-123');

      expect(result.success).toBe(true);
      expect(mockShipment.update).toHaveBeenCalledWith({ status: 'cancelled' }, { transaction: expect.any(Object) });
      expect(mockOrder.update).toHaveBeenCalledWith({ status: 'ready_to_ship' }, { transaction: expect.any(Object) });
      expect(mockAdapter.cancelShipment).toHaveBeenCalledWith({ awbNumber: 'MOCK-AWB-123' });
    });

    it('should fail if shipment is already picked_up', async () => {
      mockShipment.status = 'picked_up';

      await expect(
        shipmentService.cancelShipment('shipment-123', 'tenant-123', 'user-123')
      ).rejects.toThrow(ShipmentNotCancellableError);

      expect(mockAdapter.cancelShipment).not.toHaveBeenCalled();
    });
  });
});
