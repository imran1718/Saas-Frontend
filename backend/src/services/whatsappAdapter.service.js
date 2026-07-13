'use strict';

const interaktAdapter = require('../adapters/whatsapp/interaktAdapter');
const gupshupAdapter = require('../adapters/whatsapp/gupshupAdapter');
const logger = require('../utils/logger');

class WhatsAppAdapterService {
  constructor() {
    const providerName = (process.env.WHATSAPP_BSP || 'interakt').toLowerCase();
    
    if (providerName === 'gupshup') {
      logger.info('[WhatsAppAdapterService] Initialized Gupshup adapter stub.');
      this.adapter = gupshupAdapter;
    } else {
      logger.info('[WhatsAppAdapterService] Initialized Interakt adapter.');
      this.adapter = interaktAdapter;
    }
  }

  async sendTemplateMessage({ to, templateName, language, variables, buttons }) {
    return this.adapter.sendTemplateMessage({ to, templateName, language, variables, buttons });
  }

  async getMessageStatus(messageId) {
    return this.adapter.getMessageStatus(messageId);
  }

  async handleInboundWebhook(rawPayload, headers) {
    return this.adapter.handleInboundWebhook(rawPayload, headers);
  }
}

module.exports = new WhatsAppAdapterService();
