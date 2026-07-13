'use strict';

const codRemittanceRepository = require('../repositories/codRemittance.repository');
const walletService = require('./wallet.service');
const { CodRemittance, Shipment } = require('../models');
const { CodRemittanceBalanceMismatchError, NotFoundError } = require('../utils/errors');
const eventBus = require('../events/eventBus');
const sequelize = require('../config/db.config');
const logger = require('../utils/logger');

class CodRemittanceService {
  async createBatch(data) {
    const { seller_id, shipment_ids, gross_amount, platform_fee, remittance_mode } = data;

    const gross = parseFloat(gross_amount);
    const fee = parseFloat(platform_fee);
    const net = gross - fee;

    // Validate gross - fee = net
    if (Math.abs(gross - fee - net) > 0.01) {
      throw new CodRemittanceBalanceMismatchError('Gross amount minus platform fee must equal net amount');
    }

    const batchReference = `COD-REM-${Date.now()}`;

    return codRemittanceRepository.create({
      seller_id,
      shipment_ids,
      gross_cod_amount: gross,
      platform_fee_deducted: fee,
      net_amount: net,
      remittance_mode,
      batch_reference: batchReference,
      status: 'pending',
    });
  }

  async processBatch(id, adminId) {
    const batch = await codRemittanceRepository.findById(id);
    if (!batch) throw new NotFoundError('Remittance batch not found');

    if (batch.status === 'completed' || batch.status === 'processing') {
      return batch; // Already processed or in progress
    }

    await batch.update({ status: 'processing' });

    try {
      if (batch.remittance_mode === 'wallet_credit') {
        // Credit the seller wallet
        await walletService.credit(
          batch.seller_id,
          batch.net_amount,
          'cod_remittance',
          batch.id,
          `COD Remittance Batch Credit: Ref ${batch.batch_reference}`,
          adminId
        );

        await batch.update({
          status: 'completed',
          completed_at: new Date(),
        });
      } else {
        // Bank Payout: call payout simulator
        const payoutRef = await this.simulateBankPayout(batch);
        
        await batch.update({
          status: 'completed',
          payout_reference: payoutRef,
          completed_at: new Date(),
        });
      }

      const auditService = require('./audit.service');
      await auditService.log({
        tenant_id: batch.seller_id,
        user_id: adminId,
        action: 'cod_remittance_processed',
        entity_type: 'cod_remittance',
        entity_id: batch.id,
        metadata: { batch_reference: batch.batch_reference, amount: batch.net_amount },
      });

      eventBus.emit('cod_remittance.completed', { batch_id: batch.id, seller_id: batch.seller_id });

      return batch;
    } catch (err) {
      logger.error(`[CodRemittanceService] Failed to process batch ${id}: ${err.message}`);
      await batch.update({ status: 'failed' });
      
      eventBus.emit('cod_remittance.failed', { batch_id: batch.id, seller_id: batch.seller_id, error: err.message });
      throw err;
    }
  }

  async simulateBankPayout(batch) {
    logger.info(`[CodRemittanceService] Simulating bank payout for net amount ${batch.net_amount}`);
    // Simulate RazorpayX transfer
    const isSuccess = true; // Simulating successful transfer
    if (!isSuccess) {
      throw new Error('Payment Gateway payout transaction rejected');
    }
    return `pay_ref_${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  async listBatches(sellerId = null, options = {}) {
    const where = {};
    if (sellerId) where.seller_id = sellerId;
    return codRemittanceRepository.list({ where, ...options });
  }

  async getBatchDetails(id, sellerId = null) {
    return codRemittanceRepository.findById(id, sellerId);
  }
}

module.exports = new CodRemittanceService();
