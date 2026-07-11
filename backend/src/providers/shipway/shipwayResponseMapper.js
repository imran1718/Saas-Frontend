'use strict';

const logger = require('../../utils/logger');

// Explicit mapping table from Shipway's raw status strings to platform fixed statuses
const statusMapping = {
  'new': 'created',
  'pending': 'created',
  'ready': 'awb_generated',
  'awb_generated': 'awb_generated',
  'pickup_scheduled': 'pickup_scheduled',
  'scheduled': 'pickup_scheduled',
  'picked_up': 'picked_up',
  'pickup': 'picked_up',
  'in_transit': 'in_transit',
  'transit': 'in_transit',
  'ofd': 'out_for_delivery',
  'out_for_delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
  'failed': 'failed',
  'returned': 'failed',
};

/**
 * Normalizes a raw Shipway status string to standard platform shipment status enum.
 *
 * @param {string} rawStatus
 * @returns {string}
 */
const mapStatus = (rawStatus) => {
  if (!rawStatus) return 'in_transit';
  const normalized = rawStatus.toLowerCase().trim().replace(/\s+/g, '_');
  const mapped = statusMapping[normalized];
  if (!mapped) {
    logger.warn(`ShipwayResponseMapper: Encountered unmapped status "${rawStatus}". Defaulting to "in_transit".`);
    return 'in_transit';
  }
  return mapped;
};

module.exports = {
  mapStatus,
  statusMapping,
};
