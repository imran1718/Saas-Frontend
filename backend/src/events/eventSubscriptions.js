'use strict';

const eventBus = require('./eventBus');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

// Centralized Event to Notification Hook Mapping Registry
const subscriptionMap = {
  'order.created': (payload) => notificationService.dispatch('order.created', payload),
  'order.status_changed': (payload) => notificationService.dispatch('order.status_changed', payload),
  'shipment.created': (payload) => notificationService.dispatch('shipment.created', payload),
  'shipment.cancelled': (payload) => notificationService.dispatch('shipment.cancelled', payload),
  'tracking.status_changed': (payload) => notificationService.dispatch('tracking.status_changed', payload),
  'ndr.created': (payload) => notificationService.dispatch('ndr.created', payload),
  'ndr.action_taken': (payload) => notificationService.dispatch('ndr.action_taken', payload),
  'rto.initiated': (payload) => notificationService.dispatch('rto.initiated', payload),
  'wallet.low_balance': (payload) => notificationService.dispatch('wallet.low_balance', payload),
};

function initializeSubscriptions() {
  for (const [eventKey, handler] of Object.entries(subscriptionMap)) {
    eventBus.on(eventKey, async (payload) => {
      try {
        logger.info(`[EventSubscriptions] Triggered notification dispatch for key: "${eventKey}"`);
        await handler(payload);
      } catch (err) {
        logger.error(`[EventSubscriptions] Handler failed for "${eventKey}": ${err.message}`);
      }
    });
  }
  logger.info('[EventSubscriptions] Successfully registered all central notification hooks.');
}

module.exports = {
  initializeSubscriptions,
  subscriptionMap,
};
