'use strict';

const { InAppNotification } = require('../../models');
const logger = require('../../utils/logger');
const NotificationChannel = require('../base/NotificationChannel.interface');

class InAppChannel extends NotificationChannel {
  async send({ recipient, subject, body, metadata }) {
    try {
      const tenantId = metadata?.tenant_id;
      const title = subject || 'System Update';
      const linkUrl = metadata?.link_url || null;

      if (!tenantId || !recipient) {
        throw new Error('InApp notifications require both tenant_id and user_id (recipient).');
      }

      const notif = await InAppNotification.create({
        tenant_id: tenantId,
        user_id: recipient,
        title,
        body,
        link_url: linkUrl,
        is_read: false,
      });

      logger.info(`[InAppChannel] Created in-app notification for user ${recipient} inside tenant ${tenantId}`);
      return {
        success: true,
        providerMessageId: notif.id,
        error: null,
      };
    } catch (err) {
      logger.error(`[InAppChannel] Failed to write notification: ${err.message}`);
      return {
        success: false,
        providerMessageId: null,
        error: err.message,
      };
    }
  }
}

module.exports = InAppChannel;
