'use strict';

const { Wallet, WalletTransaction, sequelize } = require('../models');
const { InsufficientBalanceError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const auditService = require('./audit.service');

/**
 * Core: credit a tenant's wallet.
 */
async function credit(tenantId, amount, referenceType, referenceId, description, performedBy = null, transaction = null) {
  const ownTxn = !transaction;
  const txn = transaction || (await sequelize.transaction());

  try {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      throw new Error('Credit amount must be positive');
    }

    // 1. Lock the wallet row to prevent concurrent updates
    const wallet = await Wallet.findOne({
      where: { tenant_id: tenantId },
      lock: txn.LOCK.UPDATE,
      transaction: txn,
    });

    if (!wallet) {
      throw new NotFoundError('Tenant wallet not found');
    }

    const currentBalance = parseFloat(wallet.balance);
    const newBalance = currentBalance + amt;

    // 2. Insert into the immutable transaction ledger
    const ledgerTx = await WalletTransaction.create({
      wallet_id: wallet.id,
      tenant_id: tenantId,
      type: 'credit',
      amount: amt,
      balance_after: newBalance,
      reference_type: referenceType,
      reference_id: referenceId,
      description,
      performed_by: performedBy,
    }, { transaction: txn });

    // 3. Update the denormalized wallet balance cache
    await wallet.update({ balance: newBalance }, { transaction: txn });

    // 4. Audit Log
    await auditService.log({
      tenant_id: tenantId,
      user_id: performedBy,
      action: 'wallet_recharge_completed',
      entity_type: 'wallet_transaction',
      entity_id: ledgerTx.id,
      metadata: { amount: amt, type: 'credit', reference_type: referenceType, new_balance: newBalance },
    });

    if (ownTxn) await txn.commit();
    return newBalance;
  } catch (err) {
    if (ownTxn) await txn.rollback();
    logger.error(`[WalletService] Credit transaction failed: ${err.message}`);
    throw err;
  }
}

/**
 * Core: debit a tenant's wallet.
 */
async function debit(tenantId, amount, referenceType, referenceId, description, performedBy = null, transaction = null) {
  const ownTxn = !transaction;
  const txn = transaction || (await sequelize.transaction());

  try {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      throw new Error('Debit amount must be positive');
    }

    // 1. Lock the wallet row
    const wallet = await Wallet.findOne({
      where: { tenant_id: tenantId },
      lock: txn.LOCK.UPDATE,
      transaction: txn,
    });

    if (!wallet) {
      throw new NotFoundError('Tenant wallet not found');
    }

    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < amt) {
      throw new InsufficientBalanceError();
    }

    const newBalance = currentBalance - amt;

    // 2. Write ledger entry
    const ledgerTx = await WalletTransaction.create({
      wallet_id: wallet.id,
      tenant_id: tenantId,
      type: 'debit',
      amount: amt,
      balance_after: newBalance,
      reference_type: referenceType,
      reference_id: referenceId,
      description,
      performed_by: performedBy,
    }, { transaction: txn });

    // 3. Update wallet balance
    await wallet.update({ balance: newBalance }, { transaction: txn });

    // 4. Audit Log
    await auditService.log({
      tenant_id: tenantId,
      user_id: performedBy,
      action: 'wallet_debit',
      entity_type: 'wallet_transaction',
      entity_id: ledgerTx.id,
      metadata: { amount: amt, type: 'debit', reference_type: referenceType, new_balance: newBalance },
    });

    // 5. Check low balance alert threshold
    if (newBalance < parseFloat(wallet.low_balance_threshold)) {
      onLowBalance(tenantId, newBalance, parseFloat(wallet.low_balance_threshold));
    }

    if (ownTxn) await txn.commit();
    return newBalance;
  } catch (err) {
    if (ownTxn) await txn.rollback();
    logger.error(`[WalletService] Debit transaction failed: ${err.message}`);
    throw err;
  }
}

/**
 * Pre-validation locking check before booking shipments to block early.
 */
async function checkBalanceForShipment(tenantId, amount, transaction) {
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    throw new Error('Valid rate quote amount required');
  }

  const wallet = await Wallet.findOne({
    where: { tenant_id: tenantId },
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  if (!wallet) {
    throw new NotFoundError('Tenant wallet not found');
  }

  if (parseFloat(wallet.balance) < amt) {
    throw new InsufficientBalanceError();
  }

  return wallet;
}

/**
 * Recalculate wallets.balance directly from ledger database records.
 * Solves anomalies or discrepancies.
 */
async function reconcileWalletBalance(walletId) {
  const wallet = await Wallet.findByPk(walletId);
  if (!wallet) return 0;

  const credits = await WalletTransaction.sum('amount', {
    where: { wallet_id: walletId, type: 'credit' },
  }) || 0;

  const debits = await WalletTransaction.sum('amount', {
    where: { wallet_id: walletId, type: 'debit' },
  }) || 0;

  const computedBalance = credits - debits;
  await wallet.update({ balance: computedBalance });

  logger.info(`[WalletReconciliation] Reconciled wallet ${walletId}: Credits=${credits}, Debits=${debits}, CachedBalance=${wallet.balance}, FixedBalance=${computedBalance}`);
  return computedBalance;
}

// Low balance event hook
function onLowBalance(tenantId, currentBalance, threshold) {
  logger.warn(`[WalletService] LOW_BALANCE alert triggered for tenant ${tenantId}: Current balance ₹${currentBalance} is below threshold ₹${threshold}`);
  const eventBus = require('../events/eventBus');
  eventBus.emit('wallet.low_balance', {
    tenant_id: tenantId,
    balance: currentBalance,
    threshold,
  });
}

module.exports = {
  credit,
  debit,
  checkBalanceForShipment,
  reconcileWalletBalance,
  onLowBalance,
};
