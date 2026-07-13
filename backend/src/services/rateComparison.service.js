'use strict';

const { Order, ShipmentRateQuote, CourierProvider } = require('../models');
const { OrderNotShippableError } = require('../utils/errors');
const tenantCourierAccessRepository = require('../repositories/tenantCourierAccess.repository');
const providerCredentialService = require('./providerCredential.service');
const providerHealthService = require('./providerHealth.service');
const ProviderFactory = require('../providers/ProviderFactory');
const config = require('../config/env');
const auditService = require('./audit.service');
const carrierMarginConfigService = require('./carrierMarginConfig.service');
const logger = require('../utils/logger');

/**
 * Fetch and compare courier shipping rates in parallel with partial failure protection.
 *
 * @param {string} orderId
 * @param {string} tenantId
 * @param {string} userId
 * @returns {Promise<object>} Result containing rates, expiry, and unavailable providers
 */
const compareRates = async (orderId, tenantId, userId) => {
  // 1. Load order
  const order = await Order.findOne({
    where: { id: orderId, tenant_id: tenantId },
    include: ['pickupAddress'],
  });

  if (!order) {
    throw new OrderNotShippableError('Order not found');
  }

  // Allow rate comparison from processing onward
  if (!['processing', 'ready_to_ship'].includes(order.status)) {
    throw new OrderNotShippableError(`Order is in status "${order.status}" and is not shippable`);
  }

  // 2. Fetch tenant active and enabled carriers
  const tenantAccess = await tenantCourierAccessRepository.listByTenant(tenantId);
  const activeProviders = tenantAccess.map(access => access.provider);

  const rates = [];
  const unavailableProviders = [];
  const ratePromises = [];

  const expiryMinutes = config.shipment.rateQuoteExpiryMinutes;
  const quoteExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // 3. Query adapters in parallel (Promise.allSettled)
  for (const provider of activeProviders) {
    const promise = (async () => {
      // Check health status of provider
      const healthy = await providerHealthService.isHealthy(provider.id);
      if (!healthy) {
        throw new Error('PROVIDER_UNHEALTHY');
      }

      // Fetch decrypted credentials
      const fullProvider = await CourierProvider.scope('withCredentials').findByPk(provider.id);
      const credentials = providerCredentialService.decrypt(fullProvider.credentials_encrypted);
      const adapter = await ProviderFactory.getAdapter(provider.provider_key, credentials, provider.config || {}, provider.id);

      // Apply timeout ceiling to rate fetch
      const timeoutMs = config.shipment.rateComparisonTimeoutMs;
      
      const rateFetch = adapter.getRates({
        pickupPincode: order.pickupAddress.pincode,
        deliveryPincode: order.shipping_pincode,
        weight: order.weight_kg,
        dimensions: {
          length: order.length_cm,
          width: order.width_cm,
          height: order.height_cm,
        },
        paymentMode: order.payment_mode,
        codAmount: order.cod_amount ? parseFloat(order.cod_amount) : 0,
      });

      // Wrap in timeout promise
      const response = await Promise.race([
        rateFetch,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
        ),
      ]);

      if (!response.success) {
        throw response.error || new Error('FAILED');
      }

      return {
        providerId: provider.id,
        displayName: provider.display_name,
        providerKey: provider.provider_key,
        adapterRates: response.data.rates,
      };
    })();

    ratePromises.push(promise);
  }

  const results = await Promise.allSettled(ratePromises);

  // 4. Process and persist rate quotes
  const quotesToInsert = [];

  for (let i = 0; i < results.length; i++) {
    const provider = activeProviders[i];
    const result = results[i];

    if (result.status === 'fulfilled') {
      const val = result.value;
      for (const r of val.adapterRates) {
        const quoteId = require('uuid').v4();

        // G10: Resolve carrier margin for this tenant+carrier combination
        const margin = await carrierMarginConfigService.resolveMargin(val.providerId, tenantId);
        const effectivePrice = carrierMarginConfigService.applyMargin(parseFloat(r.price), margin);

        quotesToInsert.push({
          id: quoteId,
          order_id: orderId,
          courier_provider_id: val.providerId,
          service_type: r.serviceType,
          price: effectivePrice,
          cod_charge: r.codCharge || 0.00,
          estimated_days: r.estimatedDays,
          quoted_at: new Date(),
          expires_at: quoteExpiresAt,
        });

        rates.push({
          courier_provider_id: val.providerId,
          display_name: val.displayName,
          service_type: r.serviceType,
          price: effectivePrice,
          base_price: parseFloat(r.price),
          margin_applied: margin ? `${margin.margin_type}:${margin.margin_value}` : null,
          cod_charge: parseFloat(r.codCharge || 0.00),
          estimated_days: r.estimatedDays,
        });
      }
    } else {
      const reason = result.reason;
      logger.warn(`Rate query failed for courier ${provider.display_name}: ${reason.message || reason}`);
      unavailableProviders.push({
        display_name: provider.display_name,
        reason: reason.code || reason.message || 'SERVICE_UNAVAILABLE',
      });
    }
  }

  // Persist quotes in DB for audit trail and price tampering checks
  if (quotesToInsert.length > 0) {
    await ShipmentRateQuote.bulkCreate(quotesToInsert);
  }

  // Sort rates from cheapest to most expensive
  rates.sort((a, b) => a.price - b.price);

  // Log Audit trail
  await auditService.log({
    tenant_id: tenantId,
    user_id: userId,
    action: 'rates_compared',
    entity_type: 'Order',
    entity_id: orderId,
    metadata: {
      queried_count: activeProviders.length,
      success_count: rates.length,
      failed_providers: unavailableProviders.map(p => p.display_name),
    },
  });

  return {
    order_id: orderId,
    rates,
    quote_expires_at: quoteExpiresAt.toISOString(),
    unavailable_providers: unavailableProviders,
  };
};

module.exports = {
  compareRates,
};
