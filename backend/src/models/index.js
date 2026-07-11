const sequelize = require('../config/db.config');

const Tenant = require('./tenant.model');
const Role = require('./role.model');
const Permission = require('./permission.model');
const User = require('./user.model');
const RefreshToken = require('./refreshToken.model');
const AuditLog = require('./auditLog.model');
const PasswordResetToken = require('./passwordResetToken.model');
const PickupAddress = require('./pickupAddress.model');
const CompanyDocument = require('./companyDocument.model');
const Order = require('./order.model');
const OrderItem = require('./orderItem.model');
const OrderStatusHistory = require('./orderStatusHistory.model');
const OrderImport = require('./orderImport.model');
const CourierProvider = require('./courierProvider.model');
const TenantCourierAccess = require('./tenantCourierAccess.model');
const ProviderHealthLog = require('./providerHealthLog.model');
const Shipment = require('./shipment.model');
const ShipmentRateQuote = require('./shipmentRateQuote.model');
const ShipmentStatusHistory = require('./shipmentStatusHistory.model');
const TrackingEvent = require('./trackingEvent.model');
const WebhookLog = require('./webhookLog.model');
const NdrEvent = require('./ndrEvent.model');
const NdrAction = require('./ndrAction.model');
const RtoRecord = require('./rtoRecord.model');
const Wallet = require('./wallet.model');
const WalletTransaction = require('./walletTransaction.model');
const RechargeOrder = require('./rechargeOrder.model');
const Invoice = require('./invoice.model');
const InvoiceLineItem = require('./invoiceLineItem.model');
const CreditNote = require('./creditNote.model');
const InvoiceSequence = require('./invoiceSequence.model');
const SubscriptionPlan = require('./subscriptionPlan.model');
const TenantSubscription = require('./tenantSubscription.model');
const PlanUsageTracking = require('./planUsageTracking.model');
const PlanChangeHistory = require('./planChangeHistory.model');
const NotificationTemplate = require('./notificationTemplate.model');
const NotificationPreference = require('./notificationPreference.model');
const NotificationLog = require('./notificationLog.model');
const InAppNotification = require('./inAppNotification.model');
const ApiKey = require('./apiKey.model');
const ApiKeyUsageLog = require('./apiKeyUsageLog.model');
const TenantWebhook = require('./tenantWebhook.model');
const WebhookDelivery = require('./webhookDelivery.model');

// Platform Models
const PlatformAdmin = require('./platformAdmin.model');
const PlatformPermission = require('./platformPermission.model');
const PlatformRolePermission = require('./platformRolePermission.model');
const PlatformAuditLog = require('./platformAuditLog.model');
const ImpersonationSession = require('./impersonationSession.model');
const PlatformRefreshToken = require('./platformRefreshToken.model');

// --- Associations ---

// Tenant - User
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant - Role (tenant-specific roles)
Tenant.hasMany(Role, { foreignKey: 'tenant_id', as: 'roles' });
Role.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Role - User
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Role - Permission (Many-to-Many via role_permissions table)
const { DataTypes } = require('sequelize');
const RolePermission = sequelize.define('RolePermission', {
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  },
  permission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  },
}, {
  tableName: 'role_permissions',
  timestamps: false,
  underscored: true,
});

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

// User - RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - PasswordResetToken
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'passwordResetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Tenant/User - AuditLog
Tenant.hasMany(AuditLog, { foreignKey: 'tenant_id', as: 'auditLogs' });
AuditLog.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// PlatformAdmin - PlatformAuditLog
PlatformAdmin.hasMany(PlatformAuditLog, { foreignKey: 'platform_admin_id', as: 'auditLogs' });
PlatformAuditLog.belongsTo(PlatformAdmin, { foreignKey: 'platform_admin_id', as: 'admin' });

// Tenant - PlatformAuditLog
Tenant.hasMany(PlatformAuditLog, { foreignKey: 'target_tenant_id', as: 'platformAuditLogs' });
PlatformAuditLog.belongsTo(Tenant, { foreignKey: 'target_tenant_id', as: 'tenant' });

// PlatformAdmin - ImpersonationSession
PlatformAdmin.hasMany(ImpersonationSession, { foreignKey: 'platform_admin_id', as: 'impersonationSessions' });
ImpersonationSession.belongsTo(PlatformAdmin, { foreignKey: 'platform_admin_id', as: 'admin' });

// PlatformAdmin - PlatformRefreshToken
PlatformAdmin.hasMany(PlatformRefreshToken, { foreignKey: 'admin_id', as: 'refreshTokens' });
PlatformRefreshToken.belongsTo(PlatformAdmin, { foreignKey: 'admin_id', as: 'admin' });

// Tenant - ImpersonationSession
Tenant.hasMany(ImpersonationSession, { foreignKey: 'target_tenant_id', as: 'impersonationSessions' });
ImpersonationSession.belongsTo(Tenant, { foreignKey: 'target_tenant_id', as: 'tenant' });

// User - ImpersonationSession
User.hasMany(ImpersonationSession, { foreignKey: 'target_user_id', as: 'impersonationSessions' });
ImpersonationSession.belongsTo(User, { foreignKey: 'target_user_id', as: 'user' });

// Tenant - Order
Tenant.hasMany(Order, { foreignKey: 'tenant_id', as: 'orders' });
Order.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Order - OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Order - PickupAddress
PickupAddress.hasMany(Order, { foreignKey: 'pickup_address_id', as: 'orders' });
Order.belongsTo(PickupAddress, { foreignKey: 'pickup_address_id', as: 'pickupAddress' });

// Order - OrderStatusHistory
Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'statusHistory', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User - Order/OrderStatusHistory/OrderImport
User.hasMany(Order, { foreignKey: 'created_by', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(OrderStatusHistory, { foreignKey: 'changed_by', as: 'orderStatusHistories' });
OrderStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedByUser' });

// Tenant - OrderImport
Tenant.hasMany(OrderImport, { foreignKey: 'tenant_id', as: 'orderImports' });
OrderImport.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

User.hasMany(OrderImport, { foreignKey: 'uploaded_by', as: 'orderImports' });
OrderImport.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// CourierProvider - TenantCourierAccess
CourierProvider.hasMany(TenantCourierAccess, { foreignKey: 'courier_provider_id', as: 'tenantAccesses', onDelete: 'CASCADE' });
TenantCourierAccess.belongsTo(CourierProvider, { foreignKey: 'courier_provider_id', as: 'provider' });

// Tenant - TenantCourierAccess
Tenant.hasMany(TenantCourierAccess, { foreignKey: 'tenant_id', as: 'courierAccesses', onDelete: 'CASCADE' });
TenantCourierAccess.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// CourierProvider - ProviderHealthLog
CourierProvider.hasMany(ProviderHealthLog, { foreignKey: 'courier_provider_id', as: 'healthLogs', onDelete: 'CASCADE' });
ProviderHealthLog.belongsTo(CourierProvider, { foreignKey: 'courier_provider_id', as: 'provider' });

// PlatformAdmin - CourierProvider
PlatformAdmin.hasMany(CourierProvider, { foreignKey: 'created_by', as: 'createdProviders' });
CourierProvider.belongsTo(PlatformAdmin, { foreignKey: 'created_by', as: 'creator' });

// Order - Shipment (One-to-One)
Order.hasOne(Shipment, { foreignKey: 'order_id', as: 'shipment', onDelete: 'CASCADE' });
Shipment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Tenant - Shipment
Tenant.hasMany(Shipment, { foreignKey: 'tenant_id', as: 'shipments', onDelete: 'CASCADE' });
Shipment.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// CourierProvider - Shipment
CourierProvider.hasMany(Shipment, { foreignKey: 'courier_provider_id', as: 'shipments', onDelete: 'RESTRICT' });
Shipment.belongsTo(CourierProvider, { foreignKey: 'courier_provider_id', as: 'provider' });

// PickupAddress - Shipment
PickupAddress.hasMany(Shipment, { foreignKey: 'pickup_address_id', as: 'shipments', onDelete: 'RESTRICT' });
Shipment.belongsTo(PickupAddress, { foreignKey: 'pickup_address_id', as: 'pickupAddress' });

// User - Shipment
User.hasMany(Shipment, { foreignKey: 'created_by', as: 'createdShipments', onDelete: 'RESTRICT' });
Shipment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Shipment - ShipmentStatusHistory
Shipment.hasMany(ShipmentStatusHistory, { foreignKey: 'shipment_id', as: 'statusHistory', onDelete: 'CASCADE' });
ShipmentStatusHistory.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

// Order - ShipmentRateQuote
Order.hasMany(ShipmentRateQuote, { foreignKey: 'order_id', as: 'rateQuotes', onDelete: 'CASCADE' });
ShipmentRateQuote.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// CourierProvider - ShipmentRateQuote
CourierProvider.hasMany(ShipmentRateQuote, { foreignKey: 'courier_provider_id', as: 'rateQuotes', onDelete: 'CASCADE' });
ShipmentRateQuote.belongsTo(CourierProvider, { foreignKey: 'courier_provider_id', as: 'provider' });

// Shipment - TrackingEvent
Shipment.hasMany(TrackingEvent, { foreignKey: 'shipment_id', as: 'trackingEvents', onDelete: 'CASCADE' });
TrackingEvent.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

// CourierProvider - WebhookLog
CourierProvider.hasMany(WebhookLog, { foreignKey: 'courier_provider_id', as: 'webhookLogs', onDelete: 'SET NULL' });
WebhookLog.belongsTo(CourierProvider, { foreignKey: 'courier_provider_id', as: 'provider' });

// Tenant - NdrEvent
Tenant.hasMany(NdrEvent, { foreignKey: 'tenant_id', as: 'ndrEvents', onDelete: 'CASCADE' });
NdrEvent.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Shipment - NdrEvent
Shipment.hasMany(NdrEvent, { foreignKey: 'shipment_id', as: 'ndrEvents', onDelete: 'CASCADE' });
NdrEvent.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

// TrackingEvent - NdrEvent
TrackingEvent.hasMany(NdrEvent, { foreignKey: 'tracking_event_id', as: 'ndrEvents', onDelete: 'SET NULL' });
NdrEvent.belongsTo(TrackingEvent, { foreignKey: 'tracking_event_id', as: 'trackingEvent' });

// NdrEvent - NdrAction
NdrEvent.hasMany(NdrAction, { foreignKey: 'ndr_event_id', as: 'actions', onDelete: 'CASCADE' });
NdrAction.belongsTo(NdrEvent, { foreignKey: 'ndr_event_id', as: 'ndrEvent' });

// User - NdrAction
User.hasMany(NdrAction, { foreignKey: 'performed_by', as: 'ndrActions', onDelete: 'RESTRICT' });
NdrAction.belongsTo(User, { foreignKey: 'performed_by', as: 'performer' });

// Tenant - RtoRecord
Tenant.hasMany(RtoRecord, { foreignKey: 'tenant_id', as: 'rtoRecords', onDelete: 'CASCADE' });
RtoRecord.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Shipment - RtoRecord
Shipment.hasOne(RtoRecord, { foreignKey: 'shipment_id', as: 'rtoRecord', onDelete: 'CASCADE' });
RtoRecord.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

// Tenant - Wallet
Tenant.hasOne(Wallet, { foreignKey: 'tenant_id', as: 'wallet', onDelete: 'CASCADE' });
Wallet.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Wallet - WalletTransaction
Wallet.hasMany(WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions', onDelete: 'CASCADE' });
WalletTransaction.belongsTo(Wallet, { foreignKey: 'wallet_id', as: 'wallet' });

// Tenant - WalletTransaction
Tenant.hasMany(WalletTransaction, { foreignKey: 'tenant_id', as: 'walletTransactions', onDelete: 'CASCADE' });
WalletTransaction.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// User - WalletTransaction
User.hasMany(WalletTransaction, { foreignKey: 'performed_by', as: 'walletTransactions', onDelete: 'SET NULL' });
WalletTransaction.belongsTo(User, { foreignKey: 'performed_by', as: 'performer' });

// Tenant - RechargeOrder
Tenant.hasMany(RechargeOrder, { foreignKey: 'tenant_id', as: 'rechargeOrders', onDelete: 'CASCADE' });
RechargeOrder.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Wallet - RechargeOrder
Wallet.hasMany(RechargeOrder, { foreignKey: 'wallet_id', as: 'rechargeOrders', onDelete: 'CASCADE' });
RechargeOrder.belongsTo(Wallet, { foreignKey: 'wallet_id', as: 'wallet' });

// User - RechargeOrder
User.hasMany(RechargeOrder, { foreignKey: 'initiated_by', as: 'rechargeOrders', onDelete: 'RESTRICT' });
RechargeOrder.belongsTo(User, { foreignKey: 'initiated_by', as: 'initiator' });

// Tenant - Invoice
Tenant.hasMany(Invoice, { foreignKey: 'tenant_id', as: 'invoices', onDelete: 'CASCADE' });
Invoice.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Invoice - InvoiceLineItem
Invoice.hasMany(InvoiceLineItem, { foreignKey: 'invoice_id', as: 'lineItems', onDelete: 'CASCADE' });
InvoiceLineItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

// Tenant - CreditNote
Tenant.hasMany(CreditNote, { foreignKey: 'tenant_id', as: 'creditNotes', onDelete: 'CASCADE' });
CreditNote.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Invoice - CreditNote
Invoice.hasOne(CreditNote, { foreignKey: 'original_invoice_id', as: 'creditNote', onDelete: 'RESTRICT' });
CreditNote.belongsTo(Invoice, { foreignKey: 'original_invoice_id', as: 'originalInvoice' });

// Tenant - TenantSubscription
Tenant.hasOne(TenantSubscription, { foreignKey: 'tenant_id', as: 'subscription', onDelete: 'CASCADE' });
TenantSubscription.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// SubscriptionPlan - TenantSubscription
SubscriptionPlan.hasMany(TenantSubscription, { foreignKey: 'plan_id', as: 'subscriptions', onDelete: 'RESTRICT' });
TenantSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
TenantSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'pending_plan_id', as: 'pendingPlan' });

// Tenant - PlanUsageTracking
Tenant.hasMany(PlanUsageTracking, { foreignKey: 'tenant_id', as: 'usages', onDelete: 'CASCADE' });
PlanUsageTracking.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant - PlanChangeHistory
Tenant.hasMany(PlanChangeHistory, { foreignKey: 'tenant_id', as: 'subscriptionChanges', onDelete: 'CASCADE' });
PlanChangeHistory.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant - NotificationPreference
Tenant.hasMany(NotificationPreference, { foreignKey: 'tenant_id', as: 'notificationPreferences', onDelete: 'CASCADE' });
NotificationPreference.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// User - NotificationPreference
User.hasMany(NotificationPreference, { foreignKey: 'user_id', as: 'notificationPreferences', onDelete: 'CASCADE' });
NotificationPreference.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Tenant - NotificationLog
Tenant.hasMany(NotificationLog, { foreignKey: 'tenant_id', as: 'notificationLogs', onDelete: 'CASCADE' });
NotificationLog.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant - InAppNotification
Tenant.hasMany(InAppNotification, { foreignKey: 'tenant_id', as: 'inAppNotifications', onDelete: 'CASCADE' });
InAppNotification.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// User - InAppNotification
User.hasMany(InAppNotification, { foreignKey: 'user_id', as: 'inAppNotifications', onDelete: 'CASCADE' });
InAppNotification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Tenant - ApiKey
Tenant.hasMany(ApiKey, { foreignKey: 'tenant_id', as: 'apiKeys', onDelete: 'CASCADE' });
ApiKey.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// User - ApiKey
User.hasMany(ApiKey, { foreignKey: 'created_by', as: 'createdApiKeys', onDelete: 'CASCADE' });
ApiKey.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ApiKey - ApiKeyUsageLog
ApiKey.hasMany(ApiKeyUsageLog, { foreignKey: 'api_key_id', as: 'usageLogs', onDelete: 'CASCADE' });
ApiKeyUsageLog.belongsTo(ApiKey, { foreignKey: 'api_key_id', as: 'apiKey' });

// Tenant - TenantWebhook
Tenant.hasMany(TenantWebhook, { foreignKey: 'tenant_id', as: 'webhooks', onDelete: 'CASCADE' });
TenantWebhook.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// User - TenantWebhook
User.hasMany(TenantWebhook, { foreignKey: 'created_by', as: 'createdWebhooks', onDelete: 'CASCADE' });
TenantWebhook.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// TenantWebhook - WebhookDelivery
TenantWebhook.hasMany(WebhookDelivery, { foreignKey: 'tenant_webhook_id', as: 'deliveries', onDelete: 'CASCADE' });
WebhookDelivery.belongsTo(TenantWebhook, { foreignKey: 'tenant_webhook_id', as: 'webhook' });

module.exports = {
  sequelize,
  Tenant,
  Role,
  Permission,
  User,
  RefreshToken,
  AuditLog,
  PasswordResetToken,
  PlatformAdmin,
  PlatformPermission,
  PlatformRolePermission,
  PlatformAuditLog,
  ImpersonationSession,
  PlatformRefreshToken,
  PickupAddress,
  CompanyDocument,
  Order,
  OrderItem,
  OrderStatusHistory,
  OrderImport,
  CourierProvider,
  TenantCourierAccess,
  ProviderHealthLog,
  Shipment,
  ShipmentRateQuote,
  ShipmentStatusHistory,
  TrackingEvent,
  WebhookLog,
  NdrEvent,
  NdrAction,
  RtoRecord,
  Wallet,
  WalletTransaction,
  RechargeOrder,
  Invoice,
  InvoiceLineItem,
  CreditNote,
  InvoiceSequence,
  SubscriptionPlan,
  TenantSubscription,
  PlanUsageTracking,
  PlanChangeHistory,
  NotificationTemplate,
  NotificationPreference,
  NotificationLog,
  InAppNotification,
  ApiKey,
  ApiKeyUsageLog,
  TenantWebhook,
  WebhookDelivery,
};
