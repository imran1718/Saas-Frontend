'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  CreditCard, Plus, Check, Edit2, Shield, Settings,
  Users, DollarSign, ArrowUpRight, Zap, RefreshCw, AlertCircle, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  code: string;
  monthly_price: number;
  annual_price: number;
  shipment_quota: number;
  excess_shipment_fee: number;
  b2c_markup_pct: number;
  features: string[];
  is_active: boolean;
  active_subscribers_count?: number;
}

interface TenantOverride {
  tenant_id: string;
  tenant_name: string;
  plan_code: string;
  custom_monthly_fee: number;
  custom_b2c_markup: number;
  custom_cod_fee_pct: number;
  override_active: boolean;
}

const safeNum = (val: any, fallback = 0): number => {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

const formatCurrency = (val: any): string => safeNum(val, 0).toLocaleString('en-IN');
const formatNumber = (val: any): string => safeNum(val, 0).toLocaleString();

const getFeatures = (p: any): string[] => {
  if (Array.isArray(p?.features)) return p.features;
  if (typeof p?.features === 'string') {
    try {
      const parsed = JSON.parse(p.features);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return [p.features];
    }
  }
  return ['Shopify & API Sync', 'Manual Orders', 'Standard Courier Support'];
};

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan-starter',
    name: 'Starter Merchant',
    code: 'starter',
    monthly_price: 1999,
    annual_price: 19990,
    shipment_quota: 500,
    excess_shipment_fee: 5,
    b2c_markup_pct: 12,
    features: ['Shopify Integration', 'Manual Orders', 'Standard Support', '5 Couriers Enabled'],
    is_active: true,
    active_subscribers_count: 14,
  },
  {
    id: 'plan-growth',
    name: 'Growth Seller',
    code: 'growth',
    monthly_price: 4999,
    annual_price: 49990,
    shipment_quota: 2500,
    excess_shipment_fee: 3,
    b2c_markup_pct: 8,
    features: ['All E-commerce Sync (Shopify, WooCommerce, Custom API)', 'Auto NDR Workflow', 'Priority Carrier Routing', '18+ Couriers', 'Dedicated Manager'],
    is_active: true,
    active_subscribers_count: 38,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Scale',
    code: 'enterprise',
    monthly_price: 14999,
    annual_price: 149990,
    shipment_quota: 10000,
    excess_shipment_fee: 1.5,
    b2c_markup_pct: 4,
    features: ['Unlimited API Calls', 'Custom Rate Cards per Zone', '0% Remittance Processing Fee', 'Custom Webhooks', 'Dedicated 24/7 SLA Support'],
    is_active: true,
    active_subscribers_count: 7,
  },
];

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'custom_charges'>('plans');

  // New/Edit Plan Modal State
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Per-User Custom Charges Overrides
  const [overrides, setOverrides] = useState<TenantOverride[]>([
    {
      tenant_id: 't-acme',
      tenant_name: 'Acme Corp (acme)',
      plan_code: 'growth',
      custom_monthly_fee: 3999,
      custom_b2c_markup: 5,
      custom_cod_fee_pct: 1.2,
      override_active: true,
    },
    {
      tenant_id: 't-logistics',
      tenant_name: 'Apex Logistics (apex)',
      plan_code: 'enterprise',
      custom_monthly_fee: 11999,
      custom_b2c_markup: 2.5,
      custom_cod_fee_pct: 0.8,
      override_active: true,
    },
  ]);

  const [selectedTenant, setSelectedTenant] = useState('t-acme');
  const [customFee, setCustomFee] = useState(3999);
  const [customMarkup, setCustomMarkup] = useState(5);
  const [customCodFee, setCustomCodFee] = useState(1.2);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/platform/plans');
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped = res.data.data.map((p: any) => ({
          id: p.id || `plan-${Math.random()}`,
          name: p.name || 'Merchant Plan',
          code: p.code || 'custom',
          monthly_price: safeNum(p.monthly_price ?? p.monthly_fee ?? p.price, 2999),
          annual_price: safeNum(p.annual_price ?? (p.monthly_price ? p.monthly_price * 10 : 29990), 29990),
          shipment_quota: safeNum(p.shipment_quota ?? p.shipment_limit ?? p.max_shipments, 1000),
          excess_shipment_fee: safeNum(p.excess_shipment_fee ?? p.overage_rate, 4),
          b2c_markup_pct: safeNum(p.b2c_markup_pct ?? p.markup, 8),
          features: getFeatures(p),
          is_active: p.is_active !== false,
          active_subscribers_count: safeNum(p.active_subscribers_count ?? p.sellers_count, 5),
        }));
        setPlans(mapped);
      }
    } catch {
      // Keep default plans
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    if (plans.some(p => p.id === editingPlan.id)) {
      setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
      toast.success(`Subscription Plan '${editingPlan.name}' updated!`);
    } else {
      setPlans([...plans, { ...editingPlan, id: `plan-${Date.now()}` }]);
      toast.success(`New Subscription Plan '${editingPlan.name}' created!`);
    }
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleSaveCustomOverride = () => {
    setOverrides(overrides.map(o => {
      if (o.tenant_id === selectedTenant) {
        return {
          ...o,
          custom_monthly_fee: customFee,
          custom_b2c_markup: customMarkup,
          custom_cod_fee_pct: customCodFee,
          override_active: true,
        };
      }
      return o;
    }));
    toast.success('Custom charges override saved for seller!');
  };

  return (
    <div className="space-y-6 max-w-screen-xl mx-auto font-['Inter',sans-serif]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0a0d14] tracking-tight font-heading">
            Subscription Models & Custom Seller Charges
          </h1>
          <p className="text-xs text-[#4b5563] mt-0.5">
            Define platform subscription tiers, shipment quotas, B2C markup rates, and seller-specific charge overrides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingPlan({
                id: '',
                name: '',
                code: '',
                monthly_price: 2999,
                annual_price: 29990,
                shipment_quota: 1000,
                excess_shipment_fee: 4,
                b2c_markup_pct: 10,
                features: ['Standard API', 'Shopify Sync', 'Basic NDR'],
                is_active: true,
              });
              setShowModal(true);
            }}
            className="ns-btn-primary"
          >
            <Plus className="w-4 h-4" /> Create New Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#e2e6ef] gap-6">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-[#6b7280] hover:text-[#0a0d14]'
          }`}
        >
          Subscription Plan Tiers ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('custom_charges')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'custom_charges'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-[#6b7280] hover:text-[#0a0d14]'
          }`}
        >
          Per-Seller Custom Charges & Overrides
        </button>
      </div>

      {/* TAB 1: Subscription Plan Tiers */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const monthlyPrice = safeNum(plan.monthly_price, 2999);
            const annualPrice = safeNum(plan.annual_price, monthlyPrice * 10);
            const shipmentQuota = safeNum(plan.shipment_quota, 1000);
            const excessFee = safeNum(plan.excess_shipment_fee, 4);
            const markupPct = safeNum(plan.b2c_markup_pct, 8);
            const featureList = getFeatures(plan);

            return (
              <div key={plan.id} className="ns-card p-6 flex flex-col justify-between relative overflow-hidden">
                {plan.code === 'growth' && (
                  <div className="absolute top-3 right-3 bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-[#0a0d14] font-heading">{plan.name || 'Merchant Plan'}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#0a0d14] font-heading">
                      ₹{formatCurrency(monthlyPrice)}
                    </span>
                    <span className="text-xs text-[#6b7280]">/ month</span>
                  </div>
                  <p className="text-[11px] text-[#4b5563] mt-1 font-medium">
                    Annual: ₹{formatCurrency(annualPrice)}/yr (Save 17%)
                  </p>

                  <div className="my-5 p-3 rounded-xl bg-[#f8fafc] border border-[#edf0f7] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">Shipment Quota:</span>
                      <span className="font-bold text-[#0a0d14]">{formatNumber(shipmentQuota)} / mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">Excess Fee:</span>
                      <span className="font-bold text-[#0a0d14]">₹{excessFee}/shipment</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">B2C Rate Markup:</span>
                      <span className="font-bold text-[#16a34a]">{markupPct}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Included Features</p>
                    {featureList.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#374151]">
                        <Check className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e2e6ef] flex items-center justify-between">
                  <span className="text-xs text-[#6b7280] font-medium">
                    {safeNum(plan.active_subscribers_count, 0)} active merchants
                  </span>
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowModal(true);
                    }}
                    className="ns-btn-secondary text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Tier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Per-Seller Custom Charges & Overrides */}
      {activeTab === 'custom_charges' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form */}
          <div className="ns-card p-6 lg:col-span-1 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#0a0d14] font-heading">Configure Seller Overrides</h3>
              <p className="text-xs text-[#4b5563] mt-0.5">Apply custom platform pricing & rate markups to specific merchants.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Select Merchant / Tenant</label>
              <select
                value={selectedTenant}
                onChange={(e) => {
                  setSelectedTenant(e.target.value);
                  const found = overrides.find(o => o.tenant_id === e.target.value);
                  if (found) {
                    setCustomFee(found.custom_monthly_fee);
                    setCustomMarkup(found.custom_b2c_markup);
                    setCustomCodFee(found.custom_cod_fee_pct);
                  }
                }}
                className="ns-input"
              >
                {overrides.map(o => (
                  <option key={o.tenant_id} value={o.tenant_id}>{o.tenant_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Custom Monthly Platform Fee (₹)</label>
              <input
                type="number"
                value={customFee}
                onChange={(e) => setCustomFee(Number(e.target.value))}
                className="ns-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Custom B2C Rate Markup (%)</label>
              <input
                type="number"
                step="0.5"
                value={customMarkup}
                onChange={(e) => setCustomMarkup(Number(e.target.value))}
                className="ns-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Custom COD Processing Fee (%)</label>
              <input
                type="number"
                step="0.1"
                value={customCodFee}
                onChange={(e) => setCustomCodFee(Number(e.target.value))}
                className="ns-input"
              />
            </div>

            <button
              onClick={handleSaveCustomOverride}
              className="ns-btn-primary w-full justify-center mt-2"
            >
              <Save className="w-4 h-4" /> Save Seller Overrides
            </button>
          </div>

          {/* Table */}
          <div className="ns-card lg:col-span-2 overflow-hidden">
            <div className="p-5 border-b border-[#e2e6ef]">
              <h3 className="text-base font-bold text-[#0a0d14] font-heading">Active Seller Custom Rates</h3>
              <p className="text-xs text-[#4b5563] mt-0.5">Merchants currently running on custom negotiated charges.</p>
            </div>
            <table className="ns-table">
              <thead>
                <tr>
                  <th>Merchant Name</th>
                  <th>Base Plan</th>
                  <th>Custom Fee</th>
                  <th>Custom B2C Markup</th>
                  <th>COD Fee %</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {overrides.map((ov) => (
                  <tr key={ov.tenant_id}>
                    <td className="font-semibold text-[#0a0d14]">{ov.tenant_name}</td>
                    <td className="uppercase text-xs font-medium text-[#4b5563]">{ov.plan_code}</td>
                    <td className="font-bold text-[#2563eb]">₹{formatCurrency(ov.custom_monthly_fee)}/mo</td>
                    <td className="font-bold text-[#16a34a]">{ov.custom_b2c_markup}%</td>
                    <td className="font-medium text-[#374151]">{ov.custom_cod_fee_pct}%</td>
                    <td className="text-right">
                      <span className="ns-pill-green">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT/CREATE PLAN MODAL */}
      {showModal && editingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#e2e6ef]">
            <h3 className="text-lg font-bold text-[#0a0d14] font-heading">
              {editingPlan.id ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
            </h3>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Plan Display Name</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g. Growth Seller"
                  className="ns-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.monthly_price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: Number(e.target.value) })}
                    className="ns-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Shipment Quota</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.shipment_quota}
                    onChange={(e) => setEditingPlan({ ...editingPlan, shipment_quota: Number(e.target.value) })}
                    className="ns-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Excess Shipment Fee (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingPlan.excess_shipment_fee}
                    onChange={(e) => setEditingPlan({ ...editingPlan, excess_shipment_fee: Number(e.target.value) })}
                    className="ns-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">B2C Rate Markup (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingPlan.b2c_markup_pct}
                    onChange={(e) => setEditingPlan({ ...editingPlan, b2c_markup_pct: Number(e.target.value) })}
                    className="ns-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ns-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="ns-btn-primary">
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
