'use strict';

const crypto = require('crypto');
const { CourierProvider, WebhookLog } = require('../models');
const webhookProcessQueue = require('../queues/webhookProcess.queue');
const logger = require('../utils/logger');

/**
 * Verify HMAC-SHA256 signature.
 * Couriers typically send a signature header; we compare against our stored secret.
 */
function verifySignature(providerKey, payload, headers, secret) {
  if (!secret) {
    // No secret configured — treat all webhooks as valid (dev/sandbox mode)
    return true;
  }

  try {
    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Each provider uses a different header name
    const sigHeaderMap = {
      shipway: 'x-shipway-signature',
      delhivery: 'x-delhivery-signature',
      mock: 'x-mock-signature',
    };

    const headerName = sigHeaderMap[providerKey] || 'x-signature';
    const receivedSig = headers[headerName] || '';

    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(receivedSig.replace(/^sha256=/, ''), 'hex'),
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/v1/webhooks/:providerKey
 * Public endpoint — receives push notifications from courier APIs.
 * Fast-ack pattern: log immediately, verify signature, enqueue, respond 200.
 */
const receiveWebhook = async (req, res, next) => {
  const { providerKey } = req.params;

  try {
    // 1. Look up the provider
    const provider = await CourierProvider.scope('withCredentials').findOne({
      where: { provider_key: providerKey, is_active: true },
    });

    // Always respond 200 to avoid courier retry storms; log silently if unknown
    if (!provider) {
      logger.warn(`[Webhook] Received webhook for unknown or inactive provider: ${providerKey}`);
      return res.status(200).json({ received: true });
    }

    // 2. Log raw payload immediately (fast-ack)
    const webhookLog = await WebhookLog.create({
      courier_provider_id: provider.id,
      payload: req.body,
      headers: req.headers,
      signature_valid: false, // will be updated after verification
    });

    // 3. Verify signature (non-blocking — we already logged)
    const webhookSecret = provider.config?.webhook_secret || null;
    const isValid = verifySignature(providerKey, req.body, req.headers, webhookSecret);

    await webhookLog.update({ signature_valid: isValid });

    if (!isValid) {
      logger.warn(`[Webhook] Invalid signature from provider ${providerKey} — logged, not processing`);
      // Still 200 to avoid leaking info to attackers
      return res.status(200).json({ received: true });
    }

    // 4. Enqueue background processing job
    await webhookProcessQueue.add(
      `webhook-${webhookLog.id}`,
      { webhookLogId: webhookLog.id },
      { jobId: `webhook-${webhookLog.id}` },
    );

    logger.info(`[Webhook] Accepted webhook from ${providerKey}, log ${webhookLog.id} enqueued`);
    return res.status(200).json({ received: true });

  } catch (err) {
    logger.error('[Webhook] Error handling webhook:', { error: err.message });
    // Always 200 to prevent courier retries from overwhelming the server
    return res.status(200).json({ received: true });
  }
};

module.exports = { receiveWebhook };
