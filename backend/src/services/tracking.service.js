'use strict';

const { Op } = require('sequelize');
const { sequelize, Shipment, TrackingEvent, ShipmentStatusHistory, CourierProvider } = require('../models');
const shipmentStatusService = require('./shipmentStatus.service');
const ndrDetectionQueue = require('../queues/ndrDetection.queue');
const logger = require('../utils/logger');

const ACTIVE_TRANSIT_STATUSES = ['awb_generated', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery'];
const STUCK_THRESHOLD_HOURS = 72;

/**
 * Ingest an array of normalized tracking events for a shipment.
 * Deduplicates via the unique index on (shipment_id, raw_status, event_timestamp).
 * Syncs the shipment's status to the most recent event if it has changed.
 *
 * @param {string} shipmentId
 * @param {Array<{status, raw_status, location, remark, event_timestamp}>} events - normalized events
 * @param {'webhook'|'poll'|'manual'} source
 * @param {object} [transaction] - optional Sequelize transaction
 */
async function ingestTrackingEvents(shipmentId, events, source, transaction = null) {
  if (!events || events.length === 0) return;

  const ownTxn = !transaction;
  const txn = transaction || (await sequelize.transaction());

  try {
    // Sort events oldest-first so status history is chronological
    const sorted = [...events].sort(
      (a, b) => new Date(a.event_timestamp) - new Date(b.event_timestamp),
    );

    const createdEventIds = [];

    for (const ev of sorted) {
      try {
        const trackingEvent = await TrackingEvent.create(
          {
            shipment_id: shipmentId,
            status: ev.status,
            raw_status: ev.raw_status,
            location: ev.location || null,
            remark: ev.remark || null,
            event_timestamp: new Date(ev.event_timestamp),
            source,
          },
          {
            transaction: txn,
            // On duplicate unique key (shipment_id, raw_status, event_timestamp) → skip
            ignoreDuplicates: true,
          },
        );
        if (trackingEvent && trackingEvent.id) {
          createdEventIds.push(trackingEvent.id);
        }
      } catch (err) {
        // Unique constraint violation → duplicate, safe to skip
        if (err.name !== 'SequelizeUniqueConstraintError') {
          throw err;
        }
      }
    }

    // Sync shipment status to the latest event
    const latestEvent = sorted[sorted.length - 1];
    const shipment = await Shipment.findByPk(shipmentId, { transaction: txn });
    if (!shipment) {
      logger.warn(`[Tracking] Shipment ${shipmentId} not found when syncing status`);
      if (ownTxn) await txn.commit();
      return;
    }

    if (latestEvent.status !== shipment.status) {
      try {
        shipmentStatusService.validateTransition(shipment.status, latestEvent.status);
        const oldStatus = shipment.status;
        await shipment.update({ status: latestEvent.status }, { transaction: txn });
        await shipmentStatusService.logHistory(
          shipmentId,
          oldStatus,
          latestEvent.status,
          source === 'webhook' ? 'provider_webhook' : 'system',
          `Updated via ${source} — ${latestEvent.raw_status}`,
          txn,
        );

        // Emit tracking.status_changed (Module 14 Hook)
        const eventBus = require('../events/eventBus');
        eventBus.emit('tracking.status_changed', {
          tenant_id: shipment.tenant_id,
          awb_number: shipment.awb_number,
          tracking_status: latestEvent.status,
          status: latestEvent.status,
          location: latestEvent.location || 'Hub Scan',
          remarks: latestEvent.remarks || '',
        });
      } catch (transitionErr) {
        // Invalid transition (e.g. out-of-order event from courier) — log and skip status update
        logger.warn(`[Tracking] Skipping invalid transition for shipment ${shipmentId}: ${transitionErr.message}`);
      }
    }

    if (ownTxn) {
      await txn.commit();
      
      // Enqueue NDR detection jobs asynchronously after transaction commit
      for (const eventId of createdEventIds) {
        try {
          await ndrDetectionQueue.add(`ndr-detect-${eventId}`, { trackingEventId: eventId });
        } catch (queueErr) {
          logger.error(`[Tracking] Failed to enqueue NDR detection check for event ${eventId}:`, { error: queueErr.message });
        }
      }
    }
  } catch (err) {
    if (ownTxn) await txn.rollback();
    throw err;
  }
}

/**
 * Return the full ordered tracking timeline for a shipment (tenant-scoped).
 * @param {string} shipmentId
 * @param {string} tenantId
 */
async function getTrackingTimeline(shipmentId, tenantId) {
  const shipment = await Shipment.findOne({
    where: { id: shipmentId, tenant_id: tenantId },
    attributes: ['id', 'status', 'is_delayed_flag', 'awb_number'],
    include: [
      {
        model: TrackingEvent,
        as: 'trackingEvents',
        attributes: ['id', 'status', 'raw_status', 'location', 'remark', 'event_timestamp', 'source', 'ingested_at'],
        order: [['event_timestamp', 'DESC']],
        separate: true,
      },
    ],
  });

  if (!shipment) return null;

  return {
    shipment_id: shipment.id,
    awb_number: shipment.awb_number,
    current_status: shipment.status,
    is_delayed: shipment.is_delayed_flag,
    events: shipment.trackingEvents || [],
  };
}

/**
 * Public tracking — returns timeline without PII.
 * Looks up by AWB number only (no tenant scoping).
 * @param {string} awbNumber
 */
async function getPublicTracking(awbNumber) {
  const shipment = await Shipment.findOne({
    where: { awb_number: awbNumber },
    attributes: ['id', 'status', 'is_delayed_flag', 'awb_number', 'estimated_delivery_date', 'delivered_at', 'tenant_id'],
    include: [
      {
        model: CourierProvider,
        as: 'provider',
        attributes: ['display_name', 'logo_url'],
      },
      {
        model: Order,
        as: 'order',
        attributes: ['shipping_name', 'declared_value'],
      },
      {
        model: Tenant,
        as: 'tenant',
        attributes: ['company_name', 'tracking_page_logo_s3_key', 'tracking_page_color'],
      },
      {
        model: TrackingEvent,
        as: 'trackingEvents',
        attributes: ['id', 'status', 'raw_status', 'location', 'remark', 'event_timestamp', 'source'],
        order: [['event_timestamp', 'DESC']],
        separate: true,
      },
    ],
  });

  if (!shipment) return null;

  // Mask buyer's name (first name only)
  let maskedName = 'Customer';
  if (shipment.order && shipment.order.shipping_name) {
    maskedName = shipment.order.shipping_name.split(' ')[0];
  }

  // Resolve branding S3 URL
  const fileUploadService = require('./fileUpload.service');
  let logoUrl = null;
  if (shipment.tenant && shipment.tenant.tracking_page_logo_s3_key) {
    logoUrl = await fileUploadService.getPresignedGetUrl(shipment.tenant.tracking_page_logo_s3_key);
  }

  return {
    awb_number: shipment.awb_number,
    current_status: shipment.status,
    is_delayed: shipment.is_delayed_flag,
    estimated_delivery_date: shipment.estimated_delivery_date,
    delivered_at: shipment.delivered_at,
    provider: shipment.provider,
    customer_name: maskedName,
    product_name: 'Package',
    seller_branding: {
      logo_url: logoUrl,
      brand_color: shipment.tenant ? shipment.tenant.tracking_page_color : null,
    },
    events: shipment.trackingEvents || [],
  };
}

/**
 * Flag shipments as delayed if they've had no tracking event in STUCK_THRESHOLD_HOURS
 * and are still in an active transit status.
 */
async function flagStuckShipments() {
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_HOURS * 60 * 60 * 1000);

  // Find active shipments with no recent tracking event
  const stuckShipments = await Shipment.findAll({
    where: {
      status: { [Op.in]: ACTIVE_TRANSIT_STATUSES },
      is_delayed_flag: false,
    },
    include: [
      {
        model: TrackingEvent,
        as: 'trackingEvents',
        required: false,
        where: { event_timestamp: { [Op.gte]: cutoff } },
        attributes: ['id'],
      },
    ],
  });

  const stuck = stuckShipments.filter(s => s.trackingEvents.length === 0);

  if (stuck.length > 0) {
    const stuckIds = stuck.map(s => s.id);
    await Shipment.update(
      { is_delayed_flag: true },
      { where: { id: { [Op.in]: stuckIds } } },
    );
    logger.info(`[Tracking] Flagged ${stuckIds.length} shipments as delayed (stuck > ${STUCK_THRESHOLD_HOURS}h)`);
  }

  return stuck.length;
}

/**
 * Get all shipment IDs eligible for polling (active transit status, have an AWB).
 */
async function getShipmentIdsForPolling() {
  const shipments = await Shipment.findAll({
    where: {
      status: { [Op.in]: ACTIVE_TRANSIT_STATUSES },
      awb_number: { [Op.ne]: null },
    },
    attributes: ['id'],
  });
  return shipments.map(s => s.id);
}

module.exports = {
  ingestTrackingEvents,
  getTrackingTimeline,
  getPublicTracking,
  flagStuckShipments,
  getShipmentIdsForPolling,
  ACTIVE_TRANSIT_STATUSES,
};
