'use strict';

const { NdrEvent, NdrAction, RtoRecord, Shipment, CourierProvider, sequelize } = require('../models');
const ndrEventRepository = require('../repositories/ndrEvent.repository');
const rtoRecordRepository = require('../repositories/rtoRecord.repository');
const shipmentStatusService = require('./shipmentStatus.service');
const auditService = require('./audit.service');
const { RTO_STATUSES } = require('../constants/ndrReasonCodes.constant');
const ProviderFactory = require('../providers/ProviderFactory');
const providerCredentialService = require('./providerCredential.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class NdrAlreadyResolvedError extends Error {
  constructor(message = 'NDR event is already resolved') {
    super(message);
    this.name = 'NdrAlreadyResolvedError';
    this.status = 409;
    this.code = 'NDR_ALREADY_RESOLVED';
  }
}

class InvalidNdrActionError extends Error {
  constructor(message = 'Invalid NDR action') {
    super(message);
    this.name = 'InvalidNdrActionError';
    this.status = 422;
    this.code = 'INVALID_NDR_ACTION';
  }
}

/**
 * Executes a manual action on an NDR event.
 */
async function takeNdrAction(ndrEventId, tenantId, userId, actionData, transaction = null) {
  const ownTxn = !transaction;
  const txn = transaction || (await sequelize.transaction());

  try {
    const ndr = await NdrEvent.findOne({
      where: { id: ndrEventId, tenant_id: tenantId },
      include: [
        {
          model: Shipment,
          as: 'shipment',
          include: [
            {
              model: CourierProvider,
              as: 'provider',
              scope: false,
              attributes: ['id', 'provider_key', 'credentials_encrypted', 'config', 'sandbox_mode'],
            },
          ],
        },
      ],
      transaction: txn,
    });

    if (!ndr) {
      throw new NotFoundError('NDR event not found');
    }

    if (['resolved_delivered', 'resolved_rto'].includes(ndr.status)) {
      throw new NdrAlreadyResolvedError();
    }

    const { action_type, notes, updated_address_line1, updated_phone } = actionData;

    // Validate inputs
    if (action_type === 'update_address' && !updated_address_line1) {
      throw new InvalidNdrActionError('Address line 1 is required for update_address action');
    }
    if (action_type === 'update_phone' && !updated_phone) {
      throw new InvalidNdrActionError('Phone number is required for update_phone action');
    }

    // Call courier reattempt adapter method if supported
    if (['reattempt', 'update_address', 'update_phone'].includes(action_type)) {
      await callCourierReattempt(ndr.shipment, {
        action_type,
        updated_address_line1,
        updated_phone,
      });
    }

    let nextStatus = 'action_taken';
    let rtoRecordId = null;

    if (action_type === 'mark_rto') {
      nextStatus = 'resolved_rto';

      // Create RTO record
      const rto = await RtoRecord.create(
        {
          tenant_id: tenantId,
          shipment_id: ndr.shipment_id,
          initiated_reason: notes || 'Manually marked for RTO',
          initiated_by: 'manual',
          status: RTO_STATUSES.RTO_INITIATED,
        },
        { transaction: txn },
      );
      rtoRecordId = rto.id;

      // Update shipment status to cancelled (which acts as shipment cancel-to-RTO)
      const oldShipmentStatus = ndr.shipment.status;
      if (oldShipmentStatus !== 'cancelled') {
        await ndr.shipment.update({ status: 'cancelled' }, { transaction: txn });
        await shipmentStatusService.logHistory(
          ndr.shipment_id,
          oldShipmentStatus,
          'cancelled',
          'manual',
          notes || 'Manually returned to origin.',
          txn,
        );
      }

      await auditService.log({
        action: 'rto_initiated',
        tenant_id: tenantId,
        user_id: userId,
        entity_type: 'shipment',
        entity_id: ndr.shipment_id,
        metadata: { reason: 'manual_ndr_action' },
      });
    }

    // Record Action
    const action = await NdrAction.create(
      {
        ndr_event_id: ndrEventId,
        action_type,
        notes,
        updated_address_line1: action_type === 'update_address' ? updated_address_line1 : null,
        updated_phone: action_type === 'update_phone' ? updated_phone : null,
        performed_by: userId,
      },
      { transaction: txn },
    );

    // Update NDR status
    await ndr.update({ status: nextStatus }, { transaction: txn });

    await auditService.log({
      action: 'ndr_action_taken',
      tenant_id: tenantId,
      user_id: userId,
      entity_type: 'ndr_event',
      entity_id: ndrEventId,
      metadata: { action_type, notes },
    });

    if (ownTxn) await txn.commit();

    // Call notification hooks (Module 14 Hook)
    try {
      const ndrDetectionService = require('./ndrDetection.service');
      ndrDetectionService.onNdrActionTaken(ndr.shipment_id, action_type).catch(() => {});
      if (action_type === 'mark_rto') {
        ndrDetectionService.onRtoInitiated(ndr.shipment_id, 'manual').catch(() => {});
      }
    } catch (hookErr) {
      logger.error(`[NdrService] Notification hooks failed: ${hookErr.message}`);
    }

    return {
      ndr_id: ndrEventId,
      status: nextStatus,
      action_type,
      rto_record_id: rtoRecordId,
    };
  } catch (err) {
    if (ownTxn) await txn.rollback();
    throw err;
  }
}

/**
 * Courier integration helper for triggering reattempts.
 */
async function callCourierReattempt(shipment, params) {
  const provider = shipment.provider;
  if (!provider) return;

  try {
    const credentials = providerCredentialService.decrypt(provider.credentials_encrypted);
    const configData = { ...provider.config, sandbox_mode: provider.sandbox_mode };

    const adapter = await ProviderFactory.getAdapter(
      provider.provider_key,
      credentials,
      configData,
      provider.id,
    );

    if (typeof adapter.requestReattempt === 'function') {
      logger.info(`[NdrService] Calling reattempt api for AWB ${shipment.awb_number}`);
      await adapter.requestReattempt({
        awbNumber: shipment.awb_number,
        ...params,
      });
    }
  } catch (err) {
    // Reattempts are non-critical if they fail. Log and skip to ensure DB writes succeed.
    logger.warn(`[NdrService] Courier reattempt call failed: ${err.message}`);
  }
}

/**
 * Bulk action center logic. Re-validates tenant scope for every ID.
 */
async function takeBulkNdrAction(tenantId, userId, bulkData) {
  const { ndr_ids, action_type, notes, updated_address_line1, updated_phone } = bulkData;

  if (!Array.isArray(ndr_ids) || ndr_ids.length === 0) {
    throw new BadRequestError('ndr_ids array is required');
  }

  if (ndr_ids.length > 100) {
    throw new BadRequestError('Bulk action limited to maximum of 100 NDR IDs per batch');
  }

  let processed = 0;
  let failed = 0;
  const details = [];

  for (const ndrId of ndr_ids) {
    try {
      await takeNdrAction(ndrId, tenantId, userId, {
        action_type,
        notes,
        updated_address_line1,
        updated_phone,
      });
      processed++;
      details.push({ id: ndrId, success: true });
    } catch (err) {
      failed++;
      details.push({ id: ndrId, success: false, reason: err.message });
      logger.warn(`[NdrService] Bulk action failed for NDR ${ndrId}: ${err.message}`);
    }
  }

  await auditService.log({
    action: 'ndr_bulk_action',
    tenant_id: tenantId,
    user_id: userId,
    metadata: { processed, failed, action_type },
  });

  return {
    processed,
    failed,
    details,
  };
}

/**
 * Generates an aggregated breakdown of NDR events for widgets.
 */
async function getNdrSummary(tenantId) {
  // Count total open/action taken NDRs
  const totalOpen = await NdrEvent.count({
    where: {
      tenant_id: tenantId,
      status: { [Op.in]: ['open', 'action_taken'] },
    },
  });

  // Breakdown by reason code
  const reasonCounts = await NdrEvent.findAll({
    where: {
      tenant_id: tenantId,
      status: { [Op.in]: ['open', 'action_taken'] },
    },
    attributes: [
      'reason_code',
      [sequelize.fn('COUNT', sequelize.col('reason_code')), 'count'],
    ],
    group: ['reason_code'],
  });

  const byReason = {
    CUSTOMER_UNAVAILABLE: 0,
    ADDRESS_INCORRECT: 0,
    CUSTOMER_REFUSED: 0,
    COD_NOT_READY: 0,
    OTHER: 0,
  };

  reasonCounts.forEach(r => {
    const code = r.getDataValue('reason_code');
    const count = parseInt(r.getDataValue('count'), 10);
    if (byReason[code] !== undefined) {
      byReason[code] = count;
    } else {
      byReason.OTHER += count;
    }
  });

  // SLA Aging checks
  const agingOverSla = await NdrEvent.count({
    where: {
      tenant_id: tenantId,
      status: { [Op.in]: ['open', 'action_taken'] },
      sla_due_at: { [Op.lt]: new Date() },
    },
  });

  return {
    total_open: totalOpen,
    by_reason: byReason,
    aging_over_sla: agingOverSla,
  };
}

/**
 * Scheduled check for NDR SLA breaches (stub).
 */
async function checkNdrSlaBreaches() {
  const breachedEvents = await NdrEvent.findAll({
    where: {
      status: { [Op.in]: ['open', 'action_taken'] },
      sla_due_at: { [Op.lt]: new Date() },
    },
    include: [{ model: Shipment, as: 'shipment' }],
  });

  if (breachedEvents.length > 0) {
    logger.warn(`[NdrSlaBreach] Detected ${breachedEvents.length} open NDR events breaching SLA threshold!`);
    // Stub: send alerts/emails here in future notification module
  }

  return breachedEvents.length;
}

module.exports = {
  takeNdrAction,
  takeBulkNdrAction,
  getNdrSummary,
  checkNdrSlaBreaches,
  NdrAlreadyResolvedError,
  InvalidNdrActionError,
};
