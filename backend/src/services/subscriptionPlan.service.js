'use strict';

const { SubscriptionPlan, TenantSubscription, PlanUsageTracking, PlanChangeHistory, TenantCourierAccess, CourierProvider, sequelize, User } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const walletService = require('./wallet.service');
const auditService = require('./audit.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class DowngradeLimitExceededError extends BadRequestError {
  constructor(message) {
    super(message || 'Usage exceeds target plan limits', 'DOWNGRADE_LIMIT_EXCEEDED');
  }
}

/**
 * Initializes a new tenant's subscription to the default (Free) plan.
 */
async function initializeTenantSubscription(tenantId, transaction) {
  // Find default plan
  const defaultPlan = await SubscriptionPlan.findOne({
    where: { is_default: true },
    transaction,
  });

  if (!defaultPlan) {
    throw new NotFoundError('System default subscription plan not found');
  }

  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1); // 1 month period

  // Create subscription
  const sub = await TenantSubscription.create({
    tenant_id: tenantId,
    plan_id: defaultPlan.id,
    status: 'active',
    billing_cycle: 'monthly',
    current_period_start: start,
    current_period_end: end,
    auto_renew: true,
  }, { transaction });

  // Initialize tracking
  await PlanUsageTracking.create({
    tenant_id: tenantId,
    period_start: start,
    period_end: end,
    orders_count: 0,
    users_count: 1, // The initial registering user count
  }, { transaction });

  // Sync courier access tier
  await syncCourierAccess(tenantId, defaultPlan.courier_access_tier, transaction);

  // Log change history
  await PlanChangeHistory.create({
    tenant_id: tenantId,
    old_plan_id: null,
    new_plan_id: defaultPlan.id,
    change_type: 'initial',
    changed_by: null,
  }, { transaction });

  logger.info(`[SubscriptionService] Initialized subscription to default plan (${defaultPlan.name}) for tenant ${tenantId}`);
  return sub;
}

/**
 * Changes a tenant's subscription plan. Handles proration upgrades immediately and schedules downgrades.
 */
async function changeSubscription(tenantId, newPlanId, billingCycle = 'monthly', userId = null) {
  return sequelize.transaction(async (t) => {
    // 1. Fetch current subscription and new plan
    const sub = await TenantSubscription.findOne({
      where: { tenant_id: tenantId },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!sub) {
      throw new NotFoundError('Active subscription not found for tenant');
    }

    const oldPlan = sub.plan;
    const newPlan = await SubscriptionPlan.findByPk(newPlanId, { transaction: t });
    if (!newPlan) {
      throw new NotFoundError('Selected subscription plan not found');
    }

    // Determine prices
    const oldPrice = sub.billing_cycle === 'yearly' && oldPlan.price_yearly !== null ? oldPlan.price_yearly : oldPlan.price_monthly;
    const newPrice = billingCycle === 'yearly' && newPlan.price_yearly !== null ? newPlan.price_yearly : newPlan.price_monthly;

    const isUpgrade = newPrice > oldPrice;

    if (isUpgrade) {
      // UPGRADE: Apply immediately with proration
      const start = new Date(sub.current_period_start);
      const end = new Date(sub.current_period_end);
      const today = new Date();

      const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, Math.round((end - today) / (1000 * 60 * 60 * 24)));

      // Proration calculation: (newPrice - oldPrice) * (daysRemaining / totalDays)
      let proratedCharge = (newPrice - oldPrice) * (daysRemaining / totalDays);
      proratedCharge = Math.round(Math.max(0, proratedCharge) * 100) / 100;

      logger.info(`[SubscriptionService] Upgrading tenant ${tenantId} to ${newPlan.name}. Total days: ${totalDays}, remaining: ${daysRemaining}, old price: ${oldPrice}, new price: ${newPrice}, charge: ${proratedCharge}`);

      // Debit from wallet
      if (proratedCharge > 0) {
        await walletService.debit(
          tenantId,
          proratedCharge,
          'subscription_debit',
          newPlan.id,
          `Prorated upgrade charge to ${newPlan.name} (${newPlan.courier_access_tier} access)`,
          userId,
          t
        );
      }

      // Apply upgrades immediately
      await sub.update({
        plan_id: newPlan.id,
        billing_cycle: billingCycle,
        status: 'active',
        grace_period_ends_at: null,
        pending_plan_id: null, // Clear any pending downgrade
      }, { transaction: t });

      // Sync courier access tier
      await syncCourierAccess(tenantId, newPlan.courier_access_tier, t);

      // Audit and log change history
      await PlanChangeHistory.create({
        tenant_id: tenantId,
        old_plan_id: oldPlan.id,
        new_plan_id: newPlan.id,
        change_type: 'upgrade',
        changed_by: userId,
      }, { transaction: t });

      await auditService.log({
        tenant_id: tenantId,
        action: 'subscription_changed',
        entity_type: 'TenantSubscription',
        entity_id: sub.id,
        metadata: { new_plan: newPlan.name, type: 'upgrade', charge: proratedCharge },
      }, t);

      return {
        new_plan: newPlan.name,
        effective: 'immediate',
        prorated_charge: proratedCharge,
      };

    } else {
      // DOWNGRADE: Check limits first, then schedule for next cycle renewal
      const tracking = await PlanUsageTracking.findOne({
        where: {
          tenant_id: tenantId,
          period_start: sub.current_period_start,
        },
        transaction: t,
      });

      const currentOrders = tracking ? tracking.orders_count : 0;
      const currentUsers = tracking ? tracking.users_count : 0;

      // Verify limits
      if (newPlan.max_orders_per_month !== null && currentOrders > newPlan.max_orders_per_month) {
        throw new DowngradeLimitExceededError(`Current order usage (${currentOrders}) exceeds target plan limit (${newPlan.max_orders_per_month}).`);
      }

      if (newPlan.max_users !== null && currentUsers > newPlan.max_users) {
        throw new DowngradeLimitExceededError(`Current seat count (${currentUsers}) exceeds target plan limit (${newPlan.max_users}).`);
      }

      // Schedule downgrade by setting pending_plan_id
      await sub.update({
        pending_plan_id: newPlan.id,
      }, { transaction: t });

      await PlanChangeHistory.create({
        tenant_id: tenantId,
        old_plan_id: oldPlan.id,
        new_plan_id: newPlan.id,
        change_type: 'downgrade',
        changed_by: userId,
      }, { transaction: t });

      await auditService.log({
        tenant_id: tenantId,
        action: 'subscription_changed',
        entity_type: 'TenantSubscription',
        entity_id: sub.id,
        metadata: { new_plan: newPlan.name, type: 'downgrade_scheduled' },
      }, t);

      return {
        new_plan: newPlan.name,
        effective: 'deferred',
        prorated_charge: 0,
      };
    }
  });
}

/**
 * Synchronizes courier access mapping based on new courier tier.
 */
async function syncCourierAccess(tenantId, courierAccessTier, transaction) {
  const providers = await CourierProvider.findAll({ transaction });
  
  for (const prov of providers) {
    const minTier = prov.min_plan_tier || 'basic';
    const isEligible = (courierAccessTier === 'all') ||
      (courierAccessTier === 'standard' && (minTier === 'basic' || minTier === 'standard')) ||
      (courierAccessTier === 'basic' && minTier === 'basic');

    if (isEligible) {
      // Find or create access row
      await TenantCourierAccess.findOrCreate({
        where: { tenant_id: tenantId, courier_provider_id: prov.id },
        defaults: { tenant_id: tenantId, courier_provider_id: prov.id },
        transaction,
      });
    } else {
      // Revoke access
      await TenantCourierAccess.destroy({
        where: { tenant_id: tenantId, courier_provider_id: prov.id },
        transaction,
      });
    }
  }
}

module.exports = {
  initializeTenantSubscription,
  changeSubscription,
  syncCourierAccess,
  DowngradeLimitExceededError,
};
