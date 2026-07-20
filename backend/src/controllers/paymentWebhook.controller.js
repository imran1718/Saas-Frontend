'use strict';

const { PaymentGateway, WalletRechargeTransaction, Wallet, WalletTransaction, Invoice } = require('../models');
const { decrypt } = require('../utils/encryption.util');
const crypto = require('crypto');

/**
 * Public Server-to-Server Payment Webhook Receiver
 * Endpoint: POST /api/v1/webhooks/payments/:provider
 */
exports.handlePaymentWebhook = async (req, res) => {
  const { provider } = req.params;
  console.log(`[PaymentWebhook] Received ${provider} webhook payload`);

  try {
    const gateway = await PaymentGateway.findOne({ where: { name: provider } });
    if (!gateway) {
      return res.status(404).json({ success: false, message: 'Gateway not found' });
    }

    const rawWebhookSecret = decrypt(gateway.webhook_secret) || gateway.webhook_secret;

    if (provider === 'razorpay') {
      const signature = req.headers['x-razorpay-signature'];
      if (rawWebhookSecret && signature) {
        const expectedSignature = crypto
          .createHmac('sha256', rawWebhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (expectedSignature !== signature) {
          console.warn('[PaymentWebhook] Invalid Razorpay webhook signature');
          return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }
      }

      const event = req.body.event;
      const payload = req.body.payload;

      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = payload.payment ? payload.payment.entity : null;
        const orderId = paymentEntity ? paymentEntity.order_id : (payload.order ? payload.order.entity.id : null);
        const paymentId = paymentEntity ? paymentEntity.id : null;

        if (orderId) {
          await processSuccessfulRecharge(orderId, paymentId, 'razorpay_webhook');
        }
      }
    } else {
      // Cashfree / PayU / Fallback webhook
      const orderId = req.body.order_id || req.body.txnid;
      const paymentId = req.body.payment_id || req.body.mihpayid;
      if (orderId) {
        await processSuccessfulRecharge(orderId, paymentId, `${provider}_webhook`);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (err) {
    console.error('[PaymentWebhook] Processing error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Idempotent Atomic Wallet Credit Helper
 */
async function processSuccessfulRecharge(gatewayOrderId, gatewayPaymentId, source) {
  const t = await WalletRechargeTransaction.sequelize.transaction();
  try {
    const tx = await WalletRechargeTransaction.findOne({
      where: { gateway_order_id: gatewayOrderId },
      transaction: t,
    });

    if (!tx) {
      console.warn(`[PaymentWebhook] Recharge transaction not found for order ${gatewayOrderId}`);
      await t.rollback();
      return;
    }

    // Idempotency check
    if (tx.status === 'success') {
      console.log(`[PaymentWebhook] Transaction ${tx.id} already credited. Skipping duplicate.`);
      await t.rollback();
      return;
    }

    let wallet = await Wallet.findOne({ where: { tenant_id: tx.tenant_id }, transaction: t });
    if (!wallet) {
      wallet = await Wallet.create({ tenant_id: tx.tenant_id, balance: 0 }, { transaction: t });
    }

    const prevBalance = parseFloat(wallet.balance);
    const creditAmount = parseFloat(tx.amount);
    const newBalance = prevBalance + creditAmount;

    await wallet.update({ balance: newBalance }, { transaction: t });

    const ledger = await WalletTransaction.create({
      wallet_id: wallet.id,
      tenant_id: tx.tenant_id,
      type: 'credit',
      amount: creditAmount,
      balance_after: newBalance,
      reference_type: 'gateway_recharge',
      reference_id: tx.id,
      description: `Wallet top-up via ${tx.gateway_name.toUpperCase()} (Webhook)`,
      performed_by: tx.user_id,
    }, { transaction: t });

    await tx.update({
      status: 'success',
      gateway_payment_id: gatewayPaymentId || tx.gateway_payment_id,
      wallet_transaction_id: ledger.id,
      reconciled_at: new Date(),
      reconciled_by: source,
    }, { transaction: t });

    await t.commit();
    console.log(`[PaymentWebhook] Successfully credited ₹${creditAmount} to tenant ${tx.tenant_id}`);
  } catch (err) {
    await t.rollback();
    console.error('[PaymentWebhook] Transaction rollback error:', err);
  }
}
