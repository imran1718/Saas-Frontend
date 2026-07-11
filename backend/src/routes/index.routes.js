const express = require('express');
const authRoutes = require('./auth.routes');
const roleRoutes = require('./role.routes');
const permissionRoutes = require('./permission.routes');
const platformAuthRoutes = require('./platformAuth.routes');
const impersonationRoutes = require('./impersonation.routes');
const companyProfileRoutes = require('./companyProfile.routes');
const pickupAddressRoutes = require('./pickupAddress.routes');
const orderRoutes = require('./order.routes');
const orderImportRoutes = require('./orderImport.routes');
const platformCourierRoutes = require('./courierProvider.routes');
const tenantCourierRoutes = require('./tenantCourier.routes');
const rateComparisonRoutes = require('./rateComparison.routes');
const shipmentRoutes = require('./shipment.routes');
const webhookRoutes = require('./webhook.routes');
const publicTrackingRoutes = require('./publicTracking.routes');
const platformWebhookLogRoutes = require('./platformWebhookLog.routes');
const ndrRoutes = require('./ndr.routes');
const rtoRoutes = require('./rto.routes');
const walletRoutes = require('./wallet.routes');
const rechargeRoutes = require('./recharge.routes');
const walletWebhookRoutes = require('./walletWebhook.routes');
const apiKeyRoutes = require('./apiKey.routes');
const tenantWebhookRoutes = require('./tenantWebhook.routes');
const publicApiRoutes = require('./publicApi.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/platform/auth', platformAuthRoutes);
router.use('/platform/impersonate', impersonationRoutes);
router.use('/platform/couriers', platformCourierRoutes);
router.use('/company/profile', companyProfileRoutes); // Covers /profile and /documents based on routes logic
router.use('/addresses', pickupAddressRoutes);
router.use('/orders', orderImportRoutes); // Register import paths first to prevent conflict with /orders/:id
router.use('/orders', orderRoutes);
router.use('/couriers', tenantCourierRoutes);
router.use('/', rateComparisonRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/webhooks/wallet', walletWebhookRoutes);
router.use('/webhooks/inbound', webhookRoutes); // Moved to /inbound to prevent collision with tenant webhooks

// Developer API (API Keys & Webhooks)
router.use('/api-keys', apiKeyRoutes);
router.use('/webhooks', tenantWebhookRoutes);
router.use('/public', publicApiRoutes);

router.use('/track', publicTrackingRoutes);
router.use('/platform/webhook-logs', platformWebhookLogRoutes);
router.use('/ndr', ndrRoutes);
router.use('/rto', rtoRoutes);
router.use('/', walletRoutes);
router.use('/', rechargeRoutes);
router.use('/', require('./invoice.routes'));
router.use('/', require('./creditNote.routes'));
router.use('/', require('./subscriptionPlan.routes'));
router.use('/', require('./tenantSubscription.routes'));
router.use('/', require('./notification.routes'));
router.use('/', require('./notificationPreference.routes'));

module.exports = router;
