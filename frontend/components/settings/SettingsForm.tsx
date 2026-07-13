'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
  Settings, Save, RotateCcw, Info, MapPin, FileText, AlertTriangle, Wallet
} from 'lucide-react';

interface SettingField {
  value: any;
  is_override: boolean;
  source: 'tenant_override' | 'platform_default' | 'env_fallback';
}

interface TenantSettings {
  invoice_prefix: SettingField;
  ndr_auto_rto_threshold: SettingField;
  low_balance_threshold: SettingField;
  default_pickup_address_id: SettingField;
}

interface PickupAddress {
  id: string;
  label: string;
  address_line1: string;
  city: string;
}

const SOURCE_LABELS: Record<string, string> = {
  tenant_override: 'Tenant override',
  platform_default: 'Platform default',
  env_fallback: 'System default',
};

const SourceBadge = ({ source }: { source: string }) => {
  const colors: Record<string, string> = {
    tenant_override: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    platform_default: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    env_fallback: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${colors[source] || colors.env_fallback}`}>
      <Info className="w-2.5 h-2.5" />
      {SOURCE_LABELS[source] || source}
    </span>
  );
};

export default function SettingsForm() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [addresses, setAddresses] = useState<PickupAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [ndrThreshold, setNdrThreshold] = useState('');
  const [lowBalance, setLowBalance] = useState('');
  const [defaultAddressId, setDefaultAddressId] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsRes, addressRes] = await Promise.all([
        apiClient.get('/settings'),
        apiClient.get('/addresses'),
      ]);
      if (settingsRes.data.success) {
        const s: TenantSettings = settingsRes.data.data;
        setSettings(s);
        setInvoicePrefix(s.invoice_prefix.value ?? '');
        setNdrThreshold(s.ndr_auto_rto_threshold.value ?? '');
        setLowBalance(s.low_balance_threshold.value ?? '');
        setDefaultAddressId(s.default_pickup_address_id.value ?? '');
      }
      if (addressRes.data.success) {
        setAddresses(addressRes.data.data?.addresses || addressRes.data.data || []);
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      if (invoicePrefix !== (settings?.invoice_prefix.value ?? '')) {
        payload.invoice_prefix = invoicePrefix || null;
      }
      if (String(ndrThreshold) !== String(settings?.ndr_auto_rto_threshold.value ?? '')) {
        payload.ndr_auto_rto_threshold = ndrThreshold ? parseInt(ndrThreshold) : null;
      }
      if (String(lowBalance) !== String(settings?.low_balance_threshold.value ?? '')) {
        payload.low_balance_threshold = lowBalance ? parseFloat(lowBalance) : null;
      }
      if (defaultAddressId !== (settings?.default_pickup_address_id.value ?? '')) {
        payload.default_pickup_address_id = defaultAddressId || null;
      }

      if (Object.keys(payload).length === 0) {
        toast('No changes to save');
        return;
      }

      await apiClient.put('/settings', payload);
      toast.success('Settings saved successfully');
      await fetchSettings();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to save settings';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (key: string) => {
    // Sends null to clear the override
    apiClient.put('/settings', { [key]: null })
      .then(() => { toast.success('Setting reverted to platform default'); fetchSettings(); })
      .catch(() => toast.error('Failed to revert setting'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice Settings */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-semibold text-white">Invoice Settings</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Invoice Number Prefix
          </label>
          <div className="flex items-center gap-3">
            <input
              id="invoice-prefix-input"
              type="text"
              value={invoicePrefix}
              onChange={e => setInvoicePrefix(e.target.value.toUpperCase())}
              placeholder="INV"
              maxLength={20}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition text-sm"
            />
            {settings?.invoice_prefix.is_override && (
              <button
                onClick={() => handleReset('invoice_prefix')}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Revert to platform default"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-slate-500">Alphanumeric only, 2–20 chars. Example: <span className="font-mono text-slate-400">{invoicePrefix || 'INV'}/2026-27/000001</span></p>
            {settings?.invoice_prefix && <SourceBadge source={settings.invoice_prefix.source} />}
          </div>
        </div>
      </div>

      {/* NDR Settings */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">NDR / Delivery Settings</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Auto-RTO Threshold
            <span className="ml-2 text-xs text-slate-500 font-normal">Number of failed delivery attempts before auto-triggering RTO</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="ndr-threshold-input"
              type="number"
              min={1}
              max={10}
              value={ndrThreshold}
              onChange={e => setNdrThreshold(e.target.value)}
              placeholder="3"
              className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition text-sm"
            />
            {settings?.ndr_auto_rto_threshold.is_override && (
              <button
                onClick={() => handleReset('ndr_auto_rto_threshold')}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Revert to platform default"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {settings?.ndr_auto_rto_threshold && <SourceBadge source={settings.ndr_auto_rto_threshold.source} />}
          </div>
        </div>
      </div>

      {/* Wallet / Balance Settings */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">Wallet Settings</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Low Balance Notification Threshold (₹)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
              <input
                id="low-balance-threshold-input"
                type="number"
                min={0}
                step={50}
                value={lowBalance}
                onChange={e => setLowBalance(e.target.value)}
                placeholder="500"
                className="w-40 bg-white/5 border border-white/10 rounded-lg pl-7 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition text-sm"
              />
            </div>
            {settings?.low_balance_threshold.is_override && (
              <button
                onClick={() => handleReset('low_balance_threshold')}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Revert to platform default"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {settings?.low_balance_threshold && <SourceBadge source={settings.low_balance_threshold.source} />}
          </div>
        </div>
      </div>

      {/* Default Pickup Address */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-semibold text-white">Default Pickup Address</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Pre-select when creating shipments
          </label>
          <div className="flex items-center gap-3">
            <select
              id="default-pickup-address-select"
              value={defaultAddressId}
              onChange={e => setDefaultAddressId(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition text-sm"
            >
              <option value="">— No default —</option>
              {addresses.map(addr => (
                <option key={addr.id} value={addr.id}>
                  {addr.label} — {addr.address_line1}, {addr.city}
                </option>
              ))}
            </select>
            {settings?.default_pickup_address_id.is_override && (
              <button
                onClick={() => handleReset('default_pickup_address_id')}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Clear default address"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          id="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg font-medium transition"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
