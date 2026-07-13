const { v4: uuidv4 } = require('uuid');
const razorpayService = require('./razorpay.service');
const walletRechargeRepo = require('../repositories/walletRechargeRequest.repository');
const { RazorpayOrder, sequelize } = require('../models');
const walletService = require('./wallet.service');
const eventBus = require('../events/eventBus');
const platformAuditService = require('./platformAudit.service');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

const MIN_RECHARGE_RUPEES = 100;
const MAX_RECHARGE_RUPEES = 100000;

/**
 * Initiate a wallet recharge — creates a Razorpay order and a recharge_request row.
 */
const initiateRecharge = async (sellerId, amountRupees) => {
  if (amountRupees < MIN_RECHARGE_RUPEES) throw new ValidationError(`Minimum recharge is ₹${MIN_RECHARGE_RUPEES}`);
  if (amountRupees > MAX_RECHARGE_RUPEES) throw new ValidationError(`Maximum recharge is ₹${MAX_RECHARGE_RUPEES}`);

  const amountPaise = Math.round(amountRupees * 100);
  const receipt = `recharge_${sellerId.slice(0, 8)}_${Date.now()}`;

  const rzpOrder = await razorpayService.createOrder({
    amountPaise,
    currency: 'INR',
    receipt,
    notes: { seller_id: sellerId, purpose: 'wallet_recharge' },
  });

  // Persist Razorpay order
  await RazorpayOrder.create({
    id: uuidv4(),
    seller_id: sellerId,
    razorpay_order_id: rzpOrder.id,
    amount_paise: amountPaise,
    currency: 'INR',
    status: 'created',
    notes: rzpOrder.notes,
  });

  // Persist recharge request
  await walletRechargeRepo.create({
    seller_id: sellerId,
    razorpay_order_id: rzpOrder.id,
    amount_rupees: amountRupees,
    status: 'initiated',
  });

  return {
    razorpayOrderId: rzpOrder.id,
    amountPaise,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

/**
 * Confirm recharge from webhook — called after signature verification.
 * All DB writes happen in a single transaction.
 */
const confirmRecharge = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const rzpOrderRecord = await RazorpayOrder.findOne({ where: { razorpay_order_id: razorpayOrderId } });
  if (!rzpOrderRecord) {
    logger.warn(`[WalletRecharge] Unknown razorpay_order_id: ${razorpayOrderId}`);
    return;
  }

  // Idempotency guard
  if (rzpOrderRecord.status === 'paid') {
    logger.info(`[WalletRecharge] Order already paid, skipping: ${razorpayOrderId}`);
    return;
  }

  const amountRupees = rzpOrderRecord.amount_paise / 100;

  await sequelize.transaction(async (t) => {
    // 1. Mark order paid
    rzpOrderRecord.status = 'paid';
    rzpOrderRecord.razorpay_payment_id = razorpayPaymentId;
    rzpOrderRecord.razorpay_signature = razorpaySignature;
    rzpOrderRecord.paid_at = new Date();
    await rzpOrderRecord.save({ transaction: t });

    // 2. Credit wallet
    const ledgerEntry = await walletService.credit(
      rzpOrderRecord.seller_id,
      amountRupees,
      'recharge',
      `Razorpay Payment ${razorpayPaymentId}`,
      { transaction: t }
    );

    // 3. Update recharge request
    await walletRechargeRepo.updateByRazorpayOrderId(razorpayOrderId, {
      status: 'success',
      wallet_ledger_entry_id: ledgerEntry?.id || null,
      completed_at: new Date(),
    }, t);
  });

  // 4. Emit event (post-commit)
  setImmediate(() => {
    eventBus.emit('wallet.recharged', {
      seller_id: rzpOrderRecord.seller_id,
      amount_rupees: amountRupees,
      razorpay_order_id: razorpayOrderId,
    });
  });

  logger.info(`[WalletRecharge] Confirmed ₹${amountRupees} for seller ${rzpOrderRecord.seller_id}`);
};

/**
 * Mark recharge as failed.
 */
const failRecharge = async (razorpayOrderId, reason) => {
  await RazorpayOrder.update({ status: 'failed' }, { where: { razorpay_order_id: razorpayOrderId } });
  await walletRechargeRepo.updateByRazorpayOrderId(razorpayOrderId, {
    status: 'failed',
    failure_reason: reason,
    completed_at: new Date(),
  });
};

/**
 * Get recharge history for a seller.
 */
const getRechargeHistory = async (sellerId, page = 1, limit = 20) => {
  return walletRechargeRepo.findBySeller(sellerId, page, limit);
};

module.exports = { initiateRecharge, confirmRecharge, failRecharge, getRechargeHistory };
