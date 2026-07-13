'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { Tenant, User, Role, PickupAddress, Order, CourierProvider, TenantCourierAccess, Shipment, ShipmentRateQuote, ShipmentStatusHistory, OrderStatusHistory, Wallet } = require('../../src/models');
const sequelize = require('../../src/config/db.config');
const providerCredentialService = require('../../src/services/providerCredential.service');

// Mock auth middleware to inject mock user with required permissions
jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'd1356a2a-22a4-4599-a7ea-ac5168368c55',
      tenant_id: '85f3da92-c98e-49b4-b4bf-ac087114e41a',
      role: 'owner',
      permissions: ['shipment.create', 'shipment.view', 'shipment.cancel', 'shipment.label_generate'],
    };
    req.tenant = { id: '85f3da92-c98e-49b4-b4bf-ac087114e41a' };
    next();
  }
}));

// Mock fileUploadService to prevent calling real AWS/Cloudflare endpoints
jest.mock('../../src/services/fileUpload.service', () => ({
  uploadFile: jest.fn().mockResolvedValue('http://mockstorage/label.pdf'),
  deleteFile: jest.fn().mockResolvedValue(true),
}));

// Mock providerHealth.service to bypass health check queries during testing
jest.mock('../../src/services/providerHealth.service', () => ({
  isHealthy: jest.fn().mockResolvedValue(true),
}));

// Mock planEnforcement.service to bypass subscription/plan limit checks in integration tests
jest.mock('../../src/services/planEnforcement.service', () => ({
  checkLimit: jest.fn().mockResolvedValue(true),
  incrementUsage: jest.fn().mockResolvedValue(true),
}));

const axios = require('axios');
jest.spyOn(axios, 'get').mockResolvedValue({
  data: Buffer.from('%PDF-1.4 mock pdf label buffer data')
});

describe('Shipment & Rate Comparison Routes (Integration)', () => {
  const tenantId = '85f3da92-c98e-49b4-b4bf-ac087114e41a';
  const roleId = 'c03f0dc0-3d61-4502-9524-6e82f8138a64';
  const userId = 'd1356a2a-22a4-4599-a7ea-ac5168368c55';
  
  const courierProviderId = '8fa08c02-e25f-4a0b-9d41-dc08a8e3f940';
  const pickupAddressId = '12356a2a-22a4-4599-a7ea-ac5168368c55';
  const orderId = 'a1236a2a-22a4-4599-a7ea-ac5168368111';

  let testQuoteId;
  let testShipmentId;

  beforeAll(async () => {
    // 1. Seed Tenant, Role, User
    await Tenant.create({
      id: tenantId,
      company_name: 'Test Shipment Company',
      subdomain: 'test-shipment',
      status: 'active',
    });

    await Role.create({
      id: roleId,
      tenant_id: tenantId,
      name: 'owner',
      is_system_role: false,
    });

    await User.create({
      id: userId,
      tenant_id: tenantId,
      role_id: roleId,
      name: 'Test Owner User',
      email: 'shipment-owner@test.com',
      password_hash: 'mock-hash',
      status: 'active',
      email_verified_at: new Date(),
    });

    // 2. Seed CourierProvider (Mock Provider)
    const encryptedCreds = providerCredentialService.encrypt({ apiKey: 'mock-key' });
    await CourierProvider.create({
      id: courierProviderId,
      provider_key: 'mock',
      display_name: 'Mock Courier Integration',
      is_active: true,
      priority: 1,
      service_types: ['surface', 'express'],
      credentials_encrypted: encryptedCreds,
      config: {},
    });

    // 3. Enable Tenant Courier Access
    await TenantCourierAccess.create({
      tenant_id: tenantId,
      courier_provider_id: courierProviderId,
      is_enabled: true,
    });

    // 4. Seed PickupAddress
    await PickupAddress.create({
      id: pickupAddressId,
      tenant_id: tenantId,
      label: 'Main Warehouse',
      contact_name: 'Store Manager',
      contact_phone: '9876543210',
      address_line1: '123 Warehouse St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      is_default: true,
    });

    // 5. Seed Order (ready_to_ship)
    await Order.create({
      id: orderId,
      tenant_id: tenantId,
      order_reference: 'ORD-INT-777',
      pickup_address_id: pickupAddressId,
      customer_name: 'John Doe',
      customer_phone: '9999999999',
      shipping_address_line1: '456 Customer Ave',
      shipping_city: 'Delhi',
      shipping_state: 'Delhi',
      shipping_pincode: '110001',
      shipping_country: 'India',
      order_value: 120.00,
      payment_mode: 'prepaid',
      weight_kg: 1.25,
      length_cm: 15.00,
      width_cm: 10.00,
      height_cm: 5.00,
      status: 'ready_to_ship',
      created_by: userId,
    });

    // 6. Seed Wallet for Balance Checks
    await Wallet.create({
      tenant_id: tenantId,
      balance: 5000.00,
      low_balance_threshold: 500.00,
    });
  });

  afterAll(async () => {
    // Clean up database records
    await ShipmentStatusHistory.destroy({ where: {}, force: true });
    await ShipmentRateQuote.destroy({ where: {}, force: true });
    await Wallet.destroy({ where: {}, force: true });
    await Shipment.destroy({ where: {}, force: true });
    await OrderStatusHistory.destroy({ where: {}, force: true });
    await Order.destroy({ where: {}, force: true });
    await PickupAddress.destroy({ where: {}, force: true });
    await TenantCourierAccess.destroy({ where: {}, force: true });
    await CourierProvider.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
    await Tenant.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  describe('Rate Comparison & Quote Saving', () => {
    it('should successfully compare rates and record quotes in the database', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/rates`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order_id).toBe(orderId);
      expect(Array.isArray(res.body.data.rates)).toBe(true);
      expect(res.body.data.rates.length).toBeGreaterThan(0);
      
      const firstRate = res.body.data.rates[0];
      expect(firstRate.courier_provider_id).toBe(courierProviderId);
      expect(firstRate.price).toBeDefined();

      // Retrieve saved quote from DB
      const dbQuote = await ShipmentRateQuote.findOne({
        where: { order_id: orderId, courier_provider_id: courierProviderId },
      });
      expect(dbQuote).toBeDefined();
      expect(parseFloat(dbQuote.price)).toBe(firstRate.price);
    });
  });

  describe('Shipment Creation (Booking)', () => {
    it('should fail booking if price tampering is detected', async () => {
      const res = await request(app)
        .post('/api/v1/shipments')
        .send({
          order_id: orderId,
          courier_provider_id: courierProviderId,
          service_type: 'express',
          quoted_rate: 999.99, // Tampered rate
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RATE_QUOTE_EXPIRED');
    });

    it('should successfully book a shipment using a valid quote', async () => {
      // Find the quote first
      const quote = await ShipmentRateQuote.findOne({
        where: { order_id: orderId, courier_provider_id: courierProviderId, service_type: 'express' },
      });

      const res = await request(app)
        .post('/api/v1/shipments')
        .send({
          order_id: orderId,
          courier_provider_id: courierProviderId,
          service_type: 'express',
          quoted_rate: parseFloat(quote.price),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.awb_number).toBeDefined();
      expect(res.body.data.status).toBe('awb_generated');
      expect(res.body.data.label_url).toBeDefined();

      testShipmentId = res.body.data.id;

      // Verify linked order status transitioned to 'shipped'
      const updatedOrder = await Order.findByPk(orderId);
      expect(updatedOrder.status).toBe('shipped');
    });
  });

  describe('Shipment Queries', () => {
    it('should list shipments for tenant', async () => {
      const res = await request(app)
        .get('/api/v1/shipments')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rows.length).toBe(1);
      expect(res.body.data.rows[0].id).toBe(testShipmentId);
    });

    it('should return shipment detail with status history log', async () => {
      const res = await request(app)
        .get(`/api/v1/shipments/${testShipmentId}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testShipmentId);
      expect(res.body.data.order.order_reference).toBe('ORD-INT-777');
      expect(Array.isArray(res.body.data.statusHistory)).toBe(true);
      expect(res.body.data.statusHistory.length).toBeGreaterThan(0);
    });

    it('should return shipment summary counts for dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/shipments/summary')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.awb_generated).toBe(1);
    });
  });

  describe('Shipment Cancellation', () => {
    it('should cancel shipment pre-pickup and revert order back to ready_to_ship', async () => {
      const res = await request(app)
        .put(`/api/v1/shipments/${testShipmentId}/cancel`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify shipment status updated to cancelled
      const updatedShipment = await Shipment.findByPk(testShipmentId);
      expect(updatedShipment.status).toBe('cancelled');

      // Verify linked order status reverted back to ready_to_ship
      const updatedOrder = await Order.findByPk(orderId);
      expect(updatedOrder.status).toBe('ready_to_ship');
    });

    it('should block cancellation if shipment status moves past pickup_scheduled', async () => {
      // Manually set status to picked_up to test transition check
      await Shipment.update({ status: 'picked_up' }, { where: { id: testShipmentId } });

      const res = await request(app)
        .put(`/api/v1/shipments/${testShipmentId}/cancel`)
        .send();

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SHIPMENT_NOT_CANCELLABLE');
    });
  });
});
