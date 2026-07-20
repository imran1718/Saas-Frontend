'use strict';

const { PaymentGateway, WalletRechargeTransaction, Tenant, User, Wallet, WalletTransaction, Invoice } = require('../models');
const { encrypt, decrypt, maskSecret } = require('../utils/encryption.util');
const { success, error } = require('../utils/apiResponse');
const { Op } = require('sequelize');
const Razorpay = require('razorpay');

/**
 * List all configured payment gateways + global settings
 */
exports.listGateways = async (req, res) => {
  try {
    const gateways = await PaymentGateway.findAll({ order: [['created_at', 'ASC']] });

    // Format output, masking sensitive secrets
    const formatted = gateways.map(g => {
      const plain = g.get({ plain: true });
      return {
        ...plain,
        api_secret_status: plain.api_secret ? 'Configured' : 'Not set',
        api_secret_masked: maskSecret(plain.api_secret),
        webhook_secret_status: plain.webhook_secret ? 'Configured' : 'Not set',
        webhook_secret_masked: maskSecret(plain.webhook_secret),
        webhook_url: `http://localhost:5000/api/v1/webhooks/payments/${plain.name}`,
      };
    });

    const defaultGateway = gateways.find(g => g.is_default) || gateways[0];
    const globalSettings = defaultGateway ? defaultGateway.config : {
      min_recharge: 500,
      max_recharge: 100000,
      presets: [500, 1000, 2000, 5000],
      fee_percent: 0,
      auto_gst_invoice: true,
    };

    return success(res, { gateways: formatted, global_settings: globalSettings });
  } catch (err) {
    return error(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
};

/**
 * Configure / save credentials for a payment gateway
 */
exports.saveCredentials = async (req, res) => {
  try {
    const { provider } = req.params;
    const { mode, api_key, api_secret, webhook_secret } = req.body;

    let gateway = await PaymentGateway.findOne({ where: { name: provider } });
    if (!gateway) {
      return error(res, { code: 'NOT_FOUND', message: `Payment gateway '${provider}' not found` }, 404);
    }

    const updates = {};
    if (mode) updates.mode = mode;
    if (api_key !== undefined) updates.api_key = api_key;
    if (api_secret && !api_secret.startsWith('••••')) {
      updates.api_secret = encrypt(api_secret);
    }
    if (webhook_secret && !webhook_secret.startsWith('••••')) {
      updates.webhook_secret = encrypt(webhook_secret);
    }

    await gateway.update(updates);

    return success(res, {
      name: gateway.name,
      mode: gateway.mode,
      api_key: gateway.api_key,
      api_secret_status: gateway.api_secret ? 'Configured' : 'Not set',
      webhook_secret_status: gateway.webhook_secret ? 'Configured' : 'Not set',
    });
  } catch (err) {
    return error(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
};

/**
 * Activate & set a gateway as default
 */
exports.activateGateway = async (req, res) => {
  try {
    const { provider } = req.params;
    const { is_active, is_default } = req.body;

    const gateway = await PaymentGateway.findOne({ where: { name: provider } });
    if (!gateway) {
      return error(res, { code: 'NOT_FOUND', message: `Payment gateway '${provider}' not found` }, 404);
    }

    if (is_default) {
      // Unset default on all other gateways
      await PaymentGateway.update({ is_default: false }, { where: {} });
      await gateway.update({ is_active: true, is_default: true });
    } else {
      await gateway.update({ is_active: is_active ?? gateway.is_active });
    }

    return success(res, gateway);
  } catch (err) {
    return error(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
};

/**
 * Test gateway connection
 */
exports.testGatewayConnection = async (req, res) => {
  try {
    const { provider } = req.params;
    const gateway = await PaymentGateway.findOne({ where: { name: provider } });
    if (!gateway) return error(res, { code: 'NOT_FOUND', message: 'Gateway not found' }, 404);

    const rawKey = gateway.api_key;
    const rawSecret = decrypt(gateway.api_secret) || gateway.api_secret;

    if (!rawKey && provider !== 'manual') {
      return error(res, { code: 'BAD_REQUEST', message: 'API Key not configured yet' }, 400);
    }

    if (provider === 'razorpay') {
      if (!rawSecret) return error(res, { code: 'BAD_REQUEST', message: 'Razorpay Key Secret not configured' }, 400);
      const rzp = new Razorpay({ key_id: rawKey, key_secret: rawSecret });
      await rzp.orders.all({ count: 1 });
      return success(res, { status: 'success', message: 'Razorpay API credentials verified successfully!' });
    } else if (provider === 'manual') {
      return success(res, { status: 'success', message: 'Manual Bank Transfer payment method is active.' });
    } else {
      return success(res, { status: 'success', message: `${gateway.display_name} connection test passed.` });
    }
  } catch (err) {
    return error(res, { code: 'BAD_REQUEST', message: err.message || 'Gateway test connection failed' }, 400);
  }
};

/**
 * Update global recharge settings
 */
exports.updateGlobalSettings = async (req, res) => {
  try {
    const { min_recharge, max_recharge, presets, fee_percent, auto_gst_invoice } = req.body;

    const gateways = await PaymentGateway.findAll();
    for (const g of gateways) {
      const updatedConfig = {
        ...g.config,
        ...(min_recharge !== undefined && { min_recharge: Number(min_recharge) }),
        ...(max_recharge !== undefined && { max_recharge: Number(max_recharge) }),
        ...(presets && { presets: presets.map(Number) }),
        ...(fee_percent !== undefined && { fee_percent: Number(fee_percent) }),
        ...(auto_gst_invoice !== undefined && { auto_gst_invoice: Boolean(auto_gst_invoice) }),
      };
      await g.update({ config: updatedConfig });
    }

    return success(res, { message: 'Global payment & recharge settings updated successfully' });
  } catch (err) {
    return error(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
};

/**
 * List all recharge transactions for admin
 */
exports.listRechargeTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;

    const { count, rows } = await WalletRechargeTransaction.findAndCountAll({
      where,
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'company_name', 'subdomain'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayRecharged, monthRecharged, pendingCount, failedCount, totalCount, successCount] = await Promise.all([
      WalletRechargeTransaction.sum('amount', { where: { status: 'success', created_at: { [Op.gte]: today } } }),
      WalletRechargeTransaction.sum('amount', { where: { status: 'success', created_at: { [Op.gte]: firstDayMonth } } }),
      WalletRechargeTransaction.count({ where: { status: 'initiated' } }),
      WalletRechargeTransaction.count({ where: { status: 'failed' } }),
      WalletRechargeTransaction.count(),
      WalletRechargeTransaction.count({ where: { status: 'success' } }),
    ]);

    const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '100.0';

    return success(res, {
      transactions: rows,
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) },
      summary: {
        recharged_today: todayRecharged || 0,
        recharged_month: monthRecharged || 0,
        pending_count: pendingCount || 0,
        failed_count: failedCount || 0,
        success_rate: parseFloat(successRate),
      },
    });
  } catch (err) {
    return error(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
};

/**
 * Force-reconcile an initiated/stuck transaction
 */
exports.reconcileTransaction = async (req, res) => {
  const t = await WalletRechargeTransaction.sequelize.transaction();
  try {
    const { id } = req.params;
    const tx = await WalletRechargeTransaction.findByPk(id, { transaction: t });
    if (!tx) {
      await t.rollback();
      return error(res, { code: 'NOT_FOUND', message: 'Recharge transaction not found' }, 404);
    }

    if (tx.status === 'success') {
      await t.rollback();
      return error(res, { code: 'BAD_REQUEST', message: 'Transaction is already credited and successful.' }, 400);
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
      description: `Wallet top-up via ${tx.gateway_name.toUpperCase()} (Manual Admin Reconcile)`,
      performed_by: req.user ? req.user.id : null,
    }, { transaction: t });

    await tx.update({
      status: 'success',
      wallet_transaction_id: ledger.id,
      reconciled_at: new Date(),
      reconciled_by: 'admin_reconcile',
    }, { transaction: t });

    await t.commit();

    return success(res, { transaction_id: tx.id, new_balance: newBalance, message: 'Transaction force-reconciled and wallet credited successfully!' });
  } catch (err) {
    await t.rollback();
    return error(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
};
