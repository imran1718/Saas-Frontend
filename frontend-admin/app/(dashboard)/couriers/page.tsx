'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  Truck, ShieldCheck, Zap, Lock, Eye, EyeOff, RefreshCw, Copy, Check, ChevronDown, ChevronUp, CheckCircle2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CourierDef {
  code: string;
  name: string;
  category: string;
  logoColor: string;
  fields: { name: string; label: string; placeholder: string; isSecret?: boolean }[];
}

const COURIER_DEFS: CourierDef[] = [
  {
    code: 'shipway',
    name: 'Shipway Aggregator',
    category: 'Multi-Courier Aggregator',
    logoColor: 'bg-indigo-600',
    fields: [
      { name: 'username', label: 'Shipway Account Email', placeholder: 'account@company.com' },
      { name: 'api_secret', label: 'License Key / Token', placeholder: '••••••••••••••••', isSecret: true },
    ]
  },
  {
    code: 'delhivery',
    name: 'Delhivery Express Direct',
    category: 'Surface & Express Logistics',
    logoColor: 'bg-emerald-600',
    fields: [
      { name: 'username', label: 'Client Name / Account Name', placeholder: 'DELHIVERY_CLIENT_CODE' },
      { name: 'api_key', label: 'API Access Token', placeholder: '••••••••••••••••' },
      { name: 'api_secret', label: 'Secret Token', placeholder: '••••••••••••••••', isSecret: true },
    ]
  },
  {
    code: 'bluedart',
    name: 'Bluedart DHL Logistics',
    category: 'Air Express Logistics',
    logoColor: 'bg-blue-600',
    fields: [
      { name: 'username', label: 'Customer Code / Login ID', placeholder: 'BLUEDART_CUST_123' },
      { name: 'api_key', label: 'License Key', placeholder: '••••••••••••••••' },
      { name: 'api_secret', label: 'Account Password', placeholder: '••••••••••••••••', isSecret: true },
    ]
  },
  {
    code: 'xpressbees',
    name: 'Xpressbees Direct',
    category: 'E-commerce Logistics',
    logoColor: 'bg-amber-600',
    fields: [
      { name: 'username', label: 'Account Name', placeholder: 'XPRESSBEES_ACCT' },
      { name: 'api_key', label: 'API Key', placeholder: '••••••••••••••••' },
      { name: 'api_secret', label: 'Secret Token', placeholder: '••••••••••••••••', isSecret: true },
    ]
  },
  {
    code: 'ecomexpress',
    name: 'Ecom Express',
    category: 'Pan-India COD Logistics',
    logoColor: 'bg-violet-600',
    fields: [
      { name: 'username', label: 'Account Code / Username', placeholder: 'ECOM_USER_88' },
      { name: 'api_secret', label: 'Account Password', placeholder: '••••••••••••••••', isSecret: true },
    ]
  },
  {
    code: 'shadowfax',
    name: 'Shadowfax Hyperlocal & Forward',
    category: 'Hyperlocal & Same-Day Logistics',
    logoColor: 'bg-rose-600',
    fields: [
      { name: 'username', label: 'Client Code / Store ID', placeholder: 'SHADOWFAX_STORE_01' },
      { name: 'api_secret', label: 'API Token', placeholder: '••••••••••••••••', isSecret: true },
    ]
  }
];

export default function PlatformCouriersPage() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>('shipway');
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/platform/couriers');
      if (res.data.success) {
        const list = res.data.data.rows || res.data.data || [];
        setCouriers(list);

        const initialForm: Record<string, any> = {};
        COURIER_DEFS.forEach((c) => {
          const existing = list.find((item: any) => (item.code || item.name.toLowerCase()) === c.code);
          initialForm[c.code] = {
            is_active: existing ? existing.is_active : true,
            mode: existing ? (existing.mode || 'sandbox') : 'sandbox',
            api_key: existing?.api_key || '',
            api_secret: existing?.api_secret ? '••••••••' + (existing.api_secret.slice(-4) || '') : '',
            username: existing?.username || '',
          };
        });
        setFormState(initialForm);
      }
    } catch {
      toast.error('Failed to load courier providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async (code: string) => {
    try {
      setSaving(prev => ({ ...prev, [code]: true }));
      const state = formState[code] || {};
      const res = await apiClient.put(`/platform/couriers/${code}`, {
        mode: state.mode,
        api_key: state.api_key,
        api_secret: state.api_secret,
        username: state.username,
        is_active: state.is_active,
      });
      if (res.data.success) {
        toast.success(`Saved configuration for ${code.toUpperCase()}`);
        fetchCouriers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save courier credentials');
    } finally {
      setSaving(prev => ({ ...prev, [code]: false }));
    }
  };

  const handleToggleActive = async (code: string) => {
    try {
      const current = formState[code]?.is_active;
      const nextActive = !current;
      setFormState(prev => ({ ...prev, [code]: { ...prev[code], is_active: nextActive } }));

      const res = await apiClient.patch(`/platform/couriers/${code}/status`, {
        is_active: nextActive,
      });
      if (res.data.success) {
        toast.success(`${code.toUpperCase()} status set to ${nextActive ? 'ACTIVE' : 'INACTIVE'}`);
      }
    } catch {
      toast.error('Failed to toggle courier status');
    }
  };

  const handleTestConnection = async (code: string) => {
    try {
      setTesting(prev => ({ ...prev, [code]: true }));
      const res = await apiClient.post(`/platform/couriers/${code}/test`);
      if (res.data.success) {
        toast.success(`Connection test PASSED for ${code.toUpperCase()}! API is live.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Test connection failed');
    } finally {
      setTesting(prev => ({ ...prev, [code]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    toast.success('Webhook URL copied');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
          <Truck className="w-7 h-7 text-indigo-600" /> Carrier & Logistics Integration Options
        </h1>
        <p className="text-xs text-slate-500 font-bold mt-0.5">
          Configure Shipway Aggregator, direct courier accounts (Delhivery, Bluedart, Xpressbees, Ecom Express, Shadowfax), API credentials, and webhooks
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Supported Carrier & Aggregator Networks</h2>
            <p className="text-xs text-slate-500 font-medium">Toggle active providers and manage sandbox vs live production credentials</p>
          </div>
          <button onClick={fetchCouriers} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Couriers
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">Loading courier integration options...</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {COURIER_DEFS.map((c) => {
              const code = c.code;
              const isExpanded = expandedRow === code;
              const state = formState[code] || { mode: 'sandbox', is_active: true };
              const webhookUrl = `http://localhost:5000/api/v1/webhooks/inbound/${code}`;

              return (
                <div key={code} className="transition-all">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl ${c.logoColor} flex items-center justify-center shrink-0 shadow-md text-white font-black text-sm`}>
                        {code.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">{c.name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                            {c.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Code: <span className="font-mono text-slate-900 font-bold">{code}</span> | Serviceability: <span className="text-emerald-600 font-extrabold">Active</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${state.mode === 'live' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                        {state.mode || 'SANDBOX'}
                      </span>

                      <button
                        onClick={() => handleToggleActive(code)}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all ${state.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                      >
                        {state.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>

                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : code)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6 bg-slate-50/50 border-t border-slate-200 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Environment Mode</label>
                          <select
                            value={state.mode}
                            onChange={e => setFormState({ ...formState, [code]: { ...state, mode: e.target.value } })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 shadow-xs"
                          >
                            <option value="sandbox">Sandbox / Test API</option>
                            <option value="live">Live / Production API</option>
                          </select>
                        </div>

                        {c.fields.map((f) => (
                          <div key={f.name}>
                            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">{f.label}</label>
                            <div className="relative">
                              <input
                                type={f.isSecret ? (showSecret[code] ? 'text' : 'password') : 'text'}
                                value={state[f.name] || ''}
                                onChange={e => setFormState({ ...formState, [code]: { ...state, [f.name]: e.target.value } })}
                                placeholder={f.placeholder}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
                              />
                              {f.isSecret && (
                                <button
                                  type="button"
                                  onClick={() => setShowSecret({ ...showSecret, [code]: !showSecret[code] })}
                                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700"
                                >
                                  {showSecret[code] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Webhook URL */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Inbound Tracking & NDR Webhook Receiver URL</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={webhookUrl}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-indigo-600 font-mono font-bold select-all focus:outline-none shadow-xs"
                          />
                          <button
                            onClick={() => copyToClipboard(webhookUrl)}
                            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
                          >
                            {copiedUrl === webhookUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            {copiedUrl === webhookUrl ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleSaveCredentials(code)}
                          disabled={saving[code]}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
                        >
                          {saving[code] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                          {saving[code] ? 'Saving...' : 'Save Configuration'}
                        </button>

                        <button
                          onClick={() => handleTestConnection(code)}
                          disabled={testing[code]}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 transition-all shadow-xs"
                        >
                          {testing[code] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-500" />}
                          {testing[code] ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
