'use strict';

const db = require('../config/db.config');
const { Shipment, Order, CourierProvider, ShipmentRateQuote } = require('../models');
const {
  OrderNotShippableError,
  RateQuoteExpiredError,
  ProviderShipmentCreationFailedError,
  ShipmentNotCancellableError,
  NotFoundError,
} = require('../utils/errors');
const shipmentStatusService = require('./shipmentStatus.service');
const orderStatusService = require('./orderStatus.service');
const providerCredentialService = require('./providerCredential.service');
const ProviderFactory = require('../providers/ProviderFactory');
const fileUploadService = require('./fileUpload.service');
const auditService = require('./audit.service');
const logger = require('../utils/logger');
const axios = require('axios');
const walletService = require('./wallet.service');

const createShipment = async ({ order_id, courier_provider_id, service_type, quoted_rate }, tenantId, userId, req = null) => {
  return db.transaction(async (t) => {
    // 1. Load order and validate status
    const order = await Order.findOne({
      where: { id: order_id, tenant_id: tenantId },
      include: ['pickupAddress'],
      transaction: t,
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'ready_to_ship') {
      throw new OrderNotShippableError(`Order is in status "${order.status}" and cannot be shipped. Must be "ready_to_ship".`);
    }

    // 2. Validate quote freshness and price tampering
    const quote = await ShipmentRateQuote.findOne({
      where: {
        order_id,
        courier_provider_id,
        service_type,
        price: quoted_rate,
      },
      transaction: t,
    });

    if (!quote) {
      throw new RateQuoteExpiredError('No matching rate quote found for this price, provider, and service type.');
    }

    if (new Date() > new Date(quote.expires_at)) {
      throw new RateQuoteExpiredError('The rate quote has expired. Please refresh rates.');
    }

    // Check wallet balance before booking with carrier adapter
    await walletService.checkBalanceForShipment(tenantId, quoted_rate, t);

    // Check Subscription plan limit (Module 13 Hook)
    const planEnforcementService = require('./planEnforcement.service');
    await planEnforcementService.checkLimit(tenantId, 'max_orders_per_month');

    // 3. Resolve courier provider and credentials
    const provider = await CourierProvider.scope('withCredentials').findByPk(courier_provider_id, { transaction: t });
    if (!provider || !provider.is_active) {
      throw new NotFoundError('Courier provider not found or inactive');
    }

    const credentials = providerCredentialService.decrypt(provider.credentials_encrypted);
    const adapter = await ProviderFactory.getAdapter(provider.provider_key, credentials, provider.config || {}, provider.id);

    // 4. Book shipment with courier adapter
    let adapterResponse;
    try {
      adapterResponse = await adapter.createShipment({
        order: {
          order_reference: order.order_reference,
          order_value: parseFloat(order.order_value),
          payment_mode: order.payment_mode,
          cod_amount: order.cod_amount ? parseFloat(order.cod_amount) : 0,
          weight_kg: parseFloat(order.weight_kg),
        },
        pickupAddress: order.pickupAddress,
        serviceType: service_type,
      });
    } catch (err) {
      logger.error('Adapter threw exception during createShipment: ' + err.message);
      throw new ProviderShipmentCreationFailedError(err.message || 'Courier API connection failure');
    }

    if (!adapterResponse.success) {
      throw new ProviderShipmentCreationFailedError(
        adapterResponse.error ? adapterResponse.error.message : 'Courier booking failed'
      );
    }

    const { awbNumber, courierShipmentId, labelUrl, estimatedPickupDate } = adapterResponse.data;

    // 5. Re-host shipping label PDF from adapter
    let rehostedLabelUrl = labelUrl;
    if (labelUrl && labelUrl.startsWith('http')) {
      try {
        const fileResponse = await axios.get(labelUrl, { responseType: 'arraybuffer', timeout: 5000 });
        const buffer = Buffer.from(fileResponse.data);
        rehostedLabelUrl = await fileUploadService.uploadFile(
          buffer,
          'shipments/labels',
          `label-${awbNumber || order.order_reference}.pdf`,
          'application/pdf'
        );
      } catch (uploadErr) {
        logger.error('Failed to re-host shipping label PDF. Falling back to provider URL: ' + uploadErr.message);
      }
    }

    // 6. Create Shipment row
    const shipment = await Shipment.create({
      tenant_id: tenantId,
      order_id,
      courier_provider_id,
      pickup_address_id: order.pickup_address_id,
      awb_number: awbNumber || null,
      courier_shipment_id: courierShipmentId || null,
      service_type,
      selected_rate: quoted_rate,
      cod_charge: quote.cod_charge,
      declared_weight_kg: order.weight_kg,
      status: awbNumber ? 'awb_generated' : 'created',
      label_url: rehostedLabelUrl || null,
      estimated_delivery_date: estimatedPickupDate ? new Date(estimatedPickupDate) : null,
      provider_raw_response: adapterResponse.providerRawResponse || null,
      created_by: userId,
    }, { transaction: t });

    // Debit wallet for consignment shipping fee
    await walletService.debit(tenantId, quoted_rate, 'shipment_debit', shipment.id, `Shipping charge for AWB: ${awbNumber || order.order_reference}`, userId, t);

    // Auto-generate invoice (non-blocking)
    try {
      const invoiceService = require('./invoice.service');
      await invoiceService.createShipmentInvoice(shipment.id, t);
    } catch (invoiceErr) {
      logger.error(`[ShipmentService] Invoice generation failed (non-blocking): ${invoiceErr.message}`);
    }

    // Increment subscription usage (Module 13 Hook)
    await planEnforcementService.incrementUsage(tenantId, 'max_orders_per_month', 1, t);


    // 7. Write shipment status history log
    await shipmentStatusService.logHistory(shipment.id, null, 'created', 'system', 'Shipment created from order', t);
    if (awbNumber) {
      await shipmentStatusService.logHistory(shipment.id, 'created', 'awb_generated', 'system', 'AWB successfully generated by carrier', t);
    }

    // 8. Update order status to shipped and log history
    await order.update({ status: 'shipped' }, { transaction: t });
    await orderStatusService.logHistory(order.id, 'ready_to_ship', 'shipped', userId, 'Order booked and shipped via courier aggregator', t);

    // 9. Write audit log
    await auditService.log({
      tenant_id: tenantId,
      user_id: userId,
      action: 'shipment_created',
      entity_type: 'Shipment',
      entity_id: shipment.id,
      metadata: {
        order_id,
        awb_number: awbNumber,
        courier_provider_id,
        selected_rate: quoted_rate,
      },
      req,
    });

    const eventBus = require('../events/eventBus');
    eventBus.emit('shipment.created', {
      tenant_id: tenantId,
      awb_number: awbNumber,
      provider_name: provider.display_name,
      order_reference: order.order_reference,
    });

    return shipment;

  });
};

const cancelShipment = async (id, tenantId, userId, req = null) => {
  return db.transaction(async (t) => {
    // 1. Load shipment
    const shipment = await Shipment.findOne({
      where: { id, tenant_id: tenantId },
      include: [{ model: Order, as: 'order' }],
      transaction: t,
    });

    if (!shipment) {
      throw new NotFoundError('Shipment not found');
    }

    // 2. Verify shipment state is cancellable (pre-pickup only)
    const cancellableStatuses = ['created', 'awb_generated', 'pickup_scheduled'];
    if (!cancellableStatuses.includes(shipment.status)) {
      throw new ShipmentNotCancellableError(`Shipment is in status "${shipment.status}" and cannot be cancelled.`);
    }

    // 3. Decrypt credentials and call adapter.cancelShipment
    const provider = await CourierProvider.scope('withCredentials').findByPk(shipment.courier_provider_id, { transaction: t });
    if (!provider) {
      throw new NotFoundError('Courier provider not found');
    }

    const credentials = providerCredentialService.decrypt(provider.credentials_encrypted);
    const adapter = await ProviderFactory.getAdapter(provider.provider_key, credentials, provider.config || {}, provider.id);

    let adapterResponse;
    try {
      adapterResponse = await adapter.cancelShipment({ awbNumber: shipment.awb_number });
    } catch (err) {
      logger.error('Adapter threw exception during cancelShipment: ' + err.message);
      throw new ProviderShipmentCreationFailedError(err.message || 'Courier API cancel connection failure');
    }

    if (!adapterResponse.success) {
      throw new ProviderShipmentCreationFailedError(
        adapterResponse.error ? adapterResponse.error.message : 'Courier cancel booking failed'
      );
    }

    // 4. Update shipment status to cancelled and log history
    const oldStatus = shipment.status;
    await shipment.update({ status: 'cancelled' }, { transaction: t });
    await shipmentStatusService.logHistory(shipment.id, oldStatus, 'cancelled', 'manual', 'Cancelled by tenant user request', t);

    // Credit refund back to tenant wallet
    await walletService.credit(tenantId, shipment.selected_rate, 'shipment_refund', shipment.id, `Refund for cancelled AWB: ${shipment.awb_number || 'N/A'}`, userId, t);

    // Generate cancellation credit note (non-blocking)
    try {
      const creditNoteService = require('./creditNote.service');
      await creditNoteService.createCancellationCreditNote(shipment.id, 'Shipment cancelled by tenant request', t);
    } catch (cnErr) {
      logger.error(`[ShipmentService] Credit note generation failed (non-blocking): ${cnErr.message}`);
    }

    // 5. Revert order status back to ready_to_ship so it can be re-shipped
    if (shipment.order) {
      const oldOrderStatus = shipment.order.status;
      await shipment.order.update({ status: 'ready_to_ship' }, { transaction: t });
      await orderStatusService.logHistory(shipment.order.id, oldOrderStatus, 'ready_to_ship', userId, 'Order status reverted on shipment cancellation', t);
    }

    // 6. Write audit log
    await auditService.log({
      tenant_id: tenantId,
      user_id: userId,
      action: 'shipment_cancelled',
      entity_type: 'Shipment',
      entity_id: shipment.id,
      metadata: {
        awb_number: shipment.awb_number,
        order_id: shipment.order_id,
      },
      req,
    });

    const eventBus = require('../events/eventBus');
    eventBus.emit('shipment.cancelled', {
      tenant_id: tenantId,
      awb_number: shipment.awb_number,
      refund_amount: shipment.selected_rate,
    });

    return { success: true };

  });
};

const getShipmentSummary = async (tenantId) => {
  const result = await Shipment.findAll({
    where: { tenant_id: tenantId },
    attributes: [
      [db.fn('COUNT', db.col('id')), 'count'],
      'status',
    ],
    group: ['status'],
    raw: true,
  });

  // Construct summary counters object
  const summary = {
    created: 0,
    awb_generated: 0,
    pickup_scheduled: 0,
    picked_up: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    failed: 0,
  };

  result.forEach(row => {
    if (row.status in summary) {
      summary[row.status] = parseInt(row.count, 10);
    }
  });

  return summary;
};

module.exports = {
  createShipment,
  cancelShipment,
  getShipmentSummary,
};
