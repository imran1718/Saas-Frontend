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
const developerApiRoutes = require('./developerApi.routes');
const tenantAnalyticsRoutes = require('./tenantAnalytics.routes');
const platformAnalyticsRoutes = require('./platformAnalytics.routes');
const reportExportRoutes = require('./reportExport.routes');
const supportTicketRoutes = require('./supportTicket.routes');
const platformTicketRoutes = require('./platformTicket.routes');

// Module 18 — Settings & Activity Logs
const tenantSettingsRoutes = require('./tenantSettings.routes');
const platformSettingsRoutes = require('./platformSettings.routes');
const activityLogRoutes = require('./activityLog.routes');
const platformActivityLogRoutes = require('./platformActivityLog.routes');

// Module 19 — SOW Gap Closure Routes
const kycRoutes = require('./kyc.routes');
const whatsappTemplateRoutes = require('./whatsappTemplate.routes');
const weightDisputeRoutes = require('./weightDispute.routes');
const subUserRoutes = require('./subUser.routes');
const carrierMarginConfigRoutes = require('./carrierMarginConfig.routes');

const router = express.Router();

router.use('/kyc', kycRoutes);
router.use('/whatsapp', whatsappTemplateRoutes);

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
router.use('/v1', developerApiRoutes);

router.use('/track', publicTrackingRoutes);
router.use('/platform/webhook-logs', platformWebhookLogRoutes);
router.use('/ndr', ndrRoutes);
router.use('/rto', rtoRoutes);
router.use('/', walletRoutes);
router.use('/', rechargeRoutes);
router.use('/', require('./invoice.routes'));
router.use('/', require('./creditNote.routes'));
router.use('/', require('./codRemittance.routes'));
router.use('/', require('./subscriptionPlan.routes'));
router.use('/', require('./tenantSubscription.routes'));
router.use('/', require('./notification.routes'));
router.use('/', require('./notificationPreference.routes'));

router.use('/analytics', tenantAnalyticsRoutes);
router.use('/platform/analytics', platformAnalyticsRoutes);
router.use('/reports', reportExportRoutes);

router.use('/support', supportTicketRoutes);
router.use('/platform', platformTicketRoutes);

// Module 18 — Settings & Activity Logs
router.use('/settings', tenantSettingsRoutes);
router.use('/activity-log', activityLogRoutes);
router.use('/platform/settings', platformSettingsRoutes);
router.use('/platform/activity-log', platformActivityLogRoutes);

// Module 19 — G8/G9/G10 Routes
router.use('/weight-disputes', weightDisputeRoutes);
router.use('/sub-users', subUserRoutes);
router.use('/platform/carrier-margins', carrierMarginConfigRoutes);

// DPDP Act Compliance
router.use('/dpdp', require('./dpdp.routes'));

// Module 20 — Advanced Platform Layer
router.use('/wallet/recharge', require('./walletRecharge.routes'));
router.use('/integrations/storefront', require('./storefrontConnection.routes'));
router.use('/platform/whatsapp', require('./whatsappBspConfig.routes'));
router.use('/seller-webhooks', require('./sellerWebhook.routes'));

// Platform nav-counts (sidebar badge polling)
router.get('/platform/nav-counts', require('../middlewares/platformAuth.middleware').isPlatformAdmin, async (req, res) => {
  try {
    const { KycDocument, Order, SupportTicket } = require('../models');
    const { Op } = require('sequelize');
    const [kyc_pending, ndr_fresh, tickets_open] = await Promise.all([
      KycDocument ? KycDocument.count({ where: { status: 'pending' } }).catch(() => 0) : 0,
      Order ? Order.count({ where: { ndr_status: 'fresh' } }).catch(() => 0) : 0,
      SupportTicket ? SupportTicket.count({ where: { status: { [Op.in]: ['open', 'in_progress'] } } }).catch(() => 0) : 0,
    ]);
    return res.json({ success: true, data: { kyc_pending, ndr_fresh, tickets_open } });
  } catch { return res.json({ success: true, data: { kyc_pending: 0, ndr_fresh: 0, tickets_open: 0 } }); }
});

module.exports = router;

