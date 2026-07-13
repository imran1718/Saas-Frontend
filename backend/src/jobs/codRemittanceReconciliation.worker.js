'use strict';

const { Worker } = require('bullmq');
const { connection } = require('../queues/connection');
const { CodRemittance, Shipment } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const codRemittanceReconciliationWorker = new Worker(
  'cod-remittance-reconciliation',
  async (job) => {
    logger.info('[CodReconciliationWorker] Executing daily COD reconciliation audit...');

    // 1. Audit processing batches > 24 hours
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stuckBatches = await CodRemittance.findAll({
      where: {
        status: 'processing',
        updated_at: { [Op.lt]: cutoff24h },
      },
    });

    if (stuckBatches.length > 0) {
      logger.warn(`[CodReconciliationWorker] Found ${stuckBatches.length} batches stuck in processing for > 24 hours!`);
      for (const batch of stuckBatches) {
        logger.warn(`[CodReconciliationWorker] Batch ${batch.id} (Ref: ${batch.batch_reference}) is stuck.`);
        // Emit alert event or flag for manual support ticketing if needed
      }
    }

    // 2. Identify unremitted COD shipments
    // Find all delivered COD shipments
    const deliveredCodShipments = await Shipment.findAll({
      where: {
        status: 'DEL', // or whatever code is used for delivered
        // payment_type is usually stored on the linked order
      },
      include: ['order'],
    });

    const unremittedShipmentIds = [];

    // Filter shipments that are NOT associated with any CodRemittance batch
    // CodRemittance stores shipment_ids as an array of UUIDs
    for (const shipment of deliveredCodShipments) {
      if (shipment.order && shipment.order.payment_type === 'cod') {
        const alreadyRemitted = await CodRemittance.findOne({
          where: {
            shipment_ids: {
              [Op.contains]: [shipment.id],
            },
          },
        });

        if (!alreadyRemitted) {
          unremittedShipmentIds.push(shipment.id);
        }
      }
    }

    logger.info(`[CodReconciliationWorker] Audit completed. Found ${unremittedShipmentIds.length} unremitted COD shipments.`);
    
    return {
      stuck_batches_count: stuckBatches.length,
      unremitted_shipments_count: unremittedShipmentIds.length,
    };
  },
  {
    connection,
  }
);

module.exports = codRemittanceReconciliationWorker;
