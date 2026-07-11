'use strict';

const { ShipmentStatusHistory } = require('../models');

class InvalidShipmentStatusTransitionError extends Error {
  constructor(oldStatus, newStatus) {
    super(`Invalid shipment status transition from ${oldStatus} to ${newStatus}`);
    this.name = 'InvalidShipmentStatusTransitionError';
    this.code = 'INVALID_SHIPMENT_STATUS_TRANSITION';
    this.status = 422;
  }
}

class ShipmentStatusService {
  constructor() {
    this.validTransitions = {
      created: ['awb_generated', 'cancelled', 'failed'],
      awb_generated: ['pickup_scheduled', 'cancelled'],
      pickup_scheduled: ['picked_up', 'cancelled'],
      picked_up: ['in_transit'],
      in_transit: ['out_for_delivery'],
      out_for_delivery: ['delivered', 'failed'],
      delivered: [],
      cancelled: [],
      failed: [],
    };
  }

  /**
   * Validate if status transition is allowed
   * @param {string} oldStatus 
   * @param {string} newStatus 
   * @throws {InvalidShipmentStatusTransitionError}
   */
  validateTransition(oldStatus, newStatus) {
    if (oldStatus === newStatus) return;

    const allowed = this.validTransitions[oldStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new InvalidShipmentStatusTransitionError(oldStatus, newStatus);
    }
  }

  /**
   * Log shipment status transition in history
   * @param {string} shipmentId 
   * @param {string} oldStatus 
   * @param {string} newStatus 
   * @param {string} source - 'manual' | 'provider_webhook' | 'system'
   * @param {string} [note] 
   * @param {object} [transaction] 
   */
  async logHistory(shipmentId, oldStatus, newStatus, source = 'system', note = null, transaction = null) {
    await ShipmentStatusHistory.create({
      shipment_id: shipmentId,
      old_status: oldStatus,
      new_status: newStatus,
      source,
      note,
    }, { transaction });
  }
}

module.exports = new ShipmentStatusService();
module.exports.InvalidShipmentStatusTransitionError = InvalidShipmentStatusTransitionError;
