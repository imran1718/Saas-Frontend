'use strict';

jest.mock('../../src/models', () => {
  const mockProviderFindOne = jest.fn();
  const mockWebhookLogCreate = jest.fn();

  const mockProviderScope = jest.fn(() => ({
    findOne: mockProviderFindOne,
  }));

  return {
    CourierProvider: {
      scope: mockProviderScope,
    },
    WebhookLog: {
      create: mockWebhookLogCreate,
    },
  };
});

jest.mock('../../src/queues/webhookProcess.queue', () => {
  return {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  };
});

const webhookController = require('../../src/controllers/webhook.controller');
const { CourierProvider, WebhookLog } = require('../../src/models');
const webhookProcessQueue = require('../../src/queues/webhookProcess.queue');
const crypto = require('crypto');

describe('WebhookController - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockProviderScope;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: { providerKey: 'shipway' },
      body: { awb: 'AWB12345', status: 'in_transit' },
      headers: {
        'x-shipway-signature': 'sha256=validsig',
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should ignore webhooks from unknown or inactive providers', async () => {
    mockProviderScope = CourierProvider.scope();
    mockProviderScope.findOne.mockResolvedValue(null);

    await webhookController.receiveWebhook(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });
    expect(WebhookLog.create).not.toHaveBeenCalled();
  });

  it('should accept valid signature webhook, log raw payload, and enqueue processing job', async () => {
    const mockProvider = {
      id: 'provider-123',
      provider_key: 'shipway',
      is_active: true,
      config: { webhook_secret: 'supersecret' },
    };

    const mockWebhookLog = {
      id: 'log-123',
      update: jest.fn().mockResolvedValue(true),
    };

    mockProviderScope = CourierProvider.scope();
    mockProviderScope.findOne.mockResolvedValue(mockProvider);
    WebhookLog.create.mockResolvedValue(mockWebhookLog);

    // Mock signature verification
    const spy = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true);

    await webhookController.receiveWebhook(mockReq, mockRes, mockNext);

    expect(WebhookLog.create).toHaveBeenCalledWith({
      courier_provider_id: 'provider-123',
      payload: mockReq.body,
      headers: mockReq.headers,
      signature_valid: false,
    });
    expect(mockWebhookLog.update).toHaveBeenCalledWith({ signature_valid: true });
    expect(webhookProcessQueue.add).toHaveBeenCalledWith(
      'webhook-log-123',
      { webhookLogId: 'log-123' },
      { jobId: 'webhook-log-123' }
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });

    spy.mockRestore();
  });

  it('should accept webhook but not enqueue if signature verification fails', async () => {
    const mockProvider = {
      id: 'provider-123',
      provider_key: 'shipway',
      is_active: true,
      config: { webhook_secret: 'supersecret' },
    };

    const mockWebhookLog = {
      id: 'log-123',
      update: jest.fn().mockResolvedValue(true),
    };

    mockProviderScope = CourierProvider.scope();
    mockProviderScope.findOne.mockResolvedValue(mockProvider);
    WebhookLog.create.mockResolvedValue(mockWebhookLog);

    // Mock signature verification failure
    const spy = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(false);

    await webhookController.receiveWebhook(mockReq, mockRes, mockNext);

    expect(mockWebhookLog.update).toHaveBeenCalledWith({ signature_valid: false });
    expect(webhookProcessQueue.add).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });

    spy.mockRestore();
  });
});
