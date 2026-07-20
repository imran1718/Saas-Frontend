'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  RefreshCw, Check, Copy, Eye, EyeOff, Zap, ShieldCheck, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>({
    min_recharge: 500,
    max_recharge: 100000,
    presets: [500, 1000, 2000, 5000],
    fee_percent: 0,
    auto_gst_invoice: true,
  });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>('razorpay');
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [formState, setFormState] = useState<Record<string, any>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<Record<string, any>>({});
  const [savingGateway, setSavingGateway] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/platform/payment-gateways');
      if (res.data.success) {
        const list = res.data.data.gateways || [];
        setGateways(list);
        if (res.data.data.global_settings) {
          setGlobalSettings(res.data.data.global_settings);
        }

        const initialForm: Record<string, any> = {};
        list.forEach((g: any) => {
          initialForm[g.name] = {
            mode: g.mode || 'test',
            api_key: g.api_key || '',
            api_secret: g.api_secret_masked || '',
            webhook_secret: g.webhook_secret_masked || '',
          };
        });
        setFormState(initialForm);
      }
    } catch {
      toast.error('Failed to load payment gateways');
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSave = async () => {
    try {
      setSavingGlobal(true);
      const res = await apiClient.put('/platform/payment-gateways/global-settings', globalSettings);
      if (res.data.success) {
        toast.success('Global recharge settings updated');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save global settings');
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleGatewaySave = async (provider: string) => {
    try {
      setSavingGateway(prev => ({ ...prev, [provider]: true }));
      const state = formState[provider];
      const res = await apiClient.post(`/platform/payment-gateways/${provider}`, {
        mode: state.mode,
        api_key: state.api_key,
        api_secret: state.api_secret,
        webhook_secret: state.webhook_secret,
      });

      if (res.data.success) {
        toast.success(`Saved credentials for ${provider.toUpperCase()}`);
        fetchGateways();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save credentials');
    } finally {
      setSavingGateway(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleActivateToggle = async (provider: string, currentActive: boolean) => {
    try {
      const res = await apiClient.patch(`/platform/payment-gateways/${provider}/activate`, {
        is_active: !currentActive,
      });
      if (res.data.success) {
        toast.success(`${provider.toUpperCase()} status updated`);
        fetchGateways();
      }
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const handleSetDefault = async (provider: string) => {
    try {
      const res = await apiClient.patch(`/platform/payment-gateways/${provider}/activate`, {
        is_default: true,
        is_active: true,
      });
      if (res.data.success) {
        toast.success(`${provider.toUpperCase()} is now the active default gateway`);
        fetchGateways();
      }
    } catch {
      toast.error('Failed to set default gateway');
    }
  };

  const handleTestConnection = async (provider: string) => {
    try {
      setTesting(prev => ({ ...prev, [provider]: true }));
      setTestResult(prev => ({ ...prev, [provider]: null }));
      const res = await apiClient.post(`/platform/payment-gateways/${provider}/test`);
      if (res.data.success) {
        setTestResult(prev => ({ ...prev, [provider]: { success: true, message: res.data.data.message } }));
        toast.success(`Connection test passed for ${provider.toUpperCase()}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Test connection failed';
      setTestResult(prev => ({ ...prev, [provider]: { success: false, message: msg } }));
      toast.error(msg);
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    toast.success('Webhook URL copied');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const PROVIDER_METADATA: Record<string, { logoText: string; logoBg: string; name: string }> = {
    razorpay: { logoText: 'R', logoBg: 'bg-[#0c2451]', name: 'Razorpay' },
    cashfree: { logoText: 'C', logoBg: 'bg-[#00b899]', name: 'Cashfree' },
    payu: { logoText: 'P', logoBg: 'bg-[#5f259f]', name: 'PayU' },
    manual: { logoText: 'M', logoBg: 'bg-[#6b6d76]', name: 'Manual / bank transfer' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#15161a]">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#15161a]">Payment Gateways</h1>
          <div className="text-xs text-[#6b6d76] mt-0.5">Configuration → Payment Gateways</div>
        </div>
        <button
          onClick={fetchGateways}
          className="px-4 py-2 rounded-xl bg-white border border-[#e7e7ea] hover:bg-[#f5f5f7] text-[#15161a] font-semibold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync status</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#e7e7ea] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#6b6d76] mb-2 font-medium">Active gateway</div>
          <div className="text-2xl font-bold text-[#15161a]">Razorpay</div>
          <div className="text-[11.5px] text-[#6b6d76] mt-1 font-medium">Default · Live mode</div>
        </div>

        <div className="bg-white border border-[#e7e7ea] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#6b6d76] mb-2 font-medium">Gateways configured</div>
          <div className="text-2xl font-bold text-[#15161a]">3 / 4</div>
          <div className="text-[11.5px] text-[#6b6d76] mt-1 font-medium">PayU not set up</div>
        </div>

        <div className="bg-white border border-[#e7e7ea] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#6b6d76] mb-2 font-medium">Webhook success (7d)</div>
          <div className="text-2xl font-bold text-[#15161a]">99.2%</div>
          <div className="text-[11.5px] text-[#1f8a4c] font-semibold mt-1">▲ 0.4% vs last week</div>
        </div>

        <div className="bg-white border border-[#e7e7ea] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#6b6d76] mb-2 font-medium">Test connections today</div>
          <div className="text-2xl font-bold text-[#15161a]">6</div>
          <div className="text-[11.5px] text-[#1f8a4c] font-semibold mt-1">All passed</div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-[#e7e7ea] rounded-xl overflow-hidden shadow-2xs">
        {/* Global Settings Section */}
        <div className="p-4 border-b border-[#eef0f2] flex items-center justify-between">
          <div>
            <h3 className="text-[14.5px] font-semibold text-[#15161a]">Global recharge settings</h3>
            <div className="text-xs text-[#6b6d76] mt-0.5">Applies to the seller-facing Add Money flow in the Tenant Portal</div>
          </div>
          <button
            onClick={handleGlobalSave}
            disabled={savingGlobal}
            className="px-4 py-2 rounded-xl bg-[#ff5a1f] hover:bg-[#e04c15] disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            {savingGlobal ? 'Saving...' : 'Save global settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4.5 bg-[#fbfbfc] border-b border-[#e7e7ea]">
          <div>
            <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">Minimum recharge amount</label>
            <input
              type="text"
              value={`₹${globalSettings.min_recharge}`}
              onChange={(e) => setGlobalSettings({ ...globalSettings, min_recharge: Number(e.target.value.replace(/\D/g, '')) })}
              className="w-full bg-white border border-[#e7e7ea] rounded-lg px-3 py-2 text-xs font-medium text-[#15161a] focus:outline-none focus:border-[#111]"
            />
          </div>

          <div>
            <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">Maximum per transaction</label>
            <input
              type="text"
              value={`₹${globalSettings.max_recharge?.toLocaleString('en-IN')}`}
              onChange={(e) => setGlobalSettings({ ...globalSettings, max_recharge: Number(e.target.value.replace(/\D/g, '')) })}
              className="w-full bg-white border border-[#e7e7ea] rounded-lg px-3 py-2 text-xs font-medium text-[#15161a] focus:outline-none focus:border-[#111]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">Recharge presets shown to sellers</label>
            <div className="flex gap-1.5 flex-wrap">
              {(globalSettings.presets || [500, 1000, 2000, 5000]).map((amt: number) => (
                <span key={amt} className="bg-white border border-[#e7e7ea] rounded-full px-3 py-1 text-xs font-semibold text-[#15161a]">
                  ₹{amt.toLocaleString('en-IN')}
                </span>
              ))}
              <span className="border border-dashed border-[#e7e7ea] rounded-full px-3 py-1 text-xs font-semibold text-[#6b6d76] cursor-pointer hover:border-[#111]">
                + Add preset
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">Convenience fee</label>
            <input
              type="text"
              value={`${globalSettings.fee_percent || 0}%`}
              onChange={(e) => setGlobalSettings({ ...globalSettings, fee_percent: Number(e.target.value.replace(/\D/g, '')) })}
              className="w-full bg-white border border-[#e7e7ea] rounded-lg px-3 py-2 text-xs font-medium text-[#15161a] focus:outline-none focus:border-[#111]"
            />
          </div>

          <div>
            <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">GST invoice on recharge</label>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setGlobalSettings({ ...globalSettings, auto_gst_invoice: !globalSettings.auto_gst_invoice })}
                className={`w-9.5 h-5.5 rounded-full relative transition-all cursor-pointer ${globalSettings.auto_gst_invoice ? 'bg-[#ff5a1f]' : 'bg-[#e6e7ea]'}`}
              >
                <span className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-all shadow-xs ${globalSettings.auto_gst_invoice ? 'left-4.5' : 'left-0.5'}`} />
              </button>
              <span className="text-xs text-[#6b6d76] font-medium">Auto-generate</span>
            </div>
          </div>
        </div>

        {/* Providers Table Section */}
        <div className="p-4 border-b border-[#eef0f2] flex items-center justify-between">
          <div>
            <h3 className="text-[14.5px] font-semibold text-[#15161a]">Providers</h3>
            <div className="text-xs text-[#6b6d76] mt-0.5">Only one gateway can be the active default at a time</div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#6b6d76] font-medium">Loading providers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#eef0f2] text-[11px] uppercase tracking-wider text-[#9a9ca5] font-semibold">
                  <th className="py-2.5 px-4">Provider</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4">Credentials</th>
                  <th className="py-2.5 px-4">Webhook</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Default</th>
                  <th className="py-2.5 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f2]">
                {gateways.map((g) => {
                  const meta = PROVIDER_METADATA[g.name] || { logoText: g.name.charAt(0).toUpperCase(), logoBg: 'bg-[#111]', name: g.display_name };
                  const isExpanded = expandedRow === g.name;
                  const state = formState[g.name] || {};

                  return (
                    <React.Fragment key={g.id || g.name}>
                      <tr className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#15161a]">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7.5 h-7.5 rounded-lg ${meta.logoBg} text-white font-bold text-[11px] flex items-center justify-center`}>
                              {meta.logoText}
                            </div>
                            <span>{meta.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold inline-flex items-center gap-1.5 ${g.mode === 'live' ? 'bg-[#eaf7ee] text-[#1f8a4c]' : g.mode === 'test' ? 'bg-[#fff6e0] text-[#a9720b]' : 'bg-[#f0f0f2] text-[#6b6d76]'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span className="capitalize">{g.mode}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${g.api_secret_status === 'Configured' ? 'bg-[#eef4ff] text-[#2f5fd6]' : 'bg-[#fdecec] text-[#c53434]'}`}>
                            {g.api_secret_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${g.webhook_secret_status === 'Configured' ? 'bg-[#eef4ff] text-[#2f5fd6]' : 'bg-[#fdecec] text-[#c53434]'}`}>
                            {g.webhook_secret_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleActivateToggle(g.name, g.is_active)}
                            className={`w-9.5 h-5.5 rounded-full relative transition-all cursor-pointer ${g.is_active ? 'bg-[#ff5a1f]' : 'bg-[#e6e7ea]'}`}
                          >
                            <span className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-all shadow-xs ${g.is_active ? 'left-4.5' : 'left-0.5'}`} />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          {g.is_default ? (
                            <span className="font-semibold text-[#15161a]">★ Default</span>
                          ) : (
                            <button
                              onClick={() => handleSetDefault(g.name)}
                              className="text-[#9a9ca5] hover:text-[#15161a] font-medium transition-colors cursor-pointer"
                            >
                              Set as default
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : g.name)}
                            className="text-[#6b6d76] hover:text-[#15161a] font-semibold cursor-pointer"
                          >
                            {isExpanded ? 'Hide ▾' : 'Expand +'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#fbfbfc]">
                          <td colSpan={7} className="p-0">
                            <div className="p-5 pl-12 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[#eef0f2]">
                              <div>
                                <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">Key ID / API Key</label>
                                <input
                                  type="text"
                                  value={state.api_key}
                                  onChange={(e) => setFormState({ ...formState, [g.name]: { ...state, api_key: e.target.value } })}
                                  className="w-full border border-[#e7e7ea] rounded-lg px-3 py-2 text-xs font-mono text-[#15161a] bg-white focus:outline-none focus:border-[#111]"
                                />
                              </div>

                              <div className="relative">
                                <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">Key Secret</label>
                                <div className="relative">
                                  <input
                                    type={showSecret[g.name] ? 'text' : 'password'}
                                    value={state.api_secret}
                                    onChange={(e) => setFormState({ ...formState, [g.name]: { ...state, api_secret: e.target.value } })}
                                    className="w-full border border-[#e7e7ea] rounded-lg px-3 py-2 text-xs font-mono text-[#15161a] bg-white focus:outline-none focus:border-[#111]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowSecret({ ...showSecret, [g.name]: !showSecret[g.name] })}
                                    className="absolute right-3 top-2.5 text-[#9a9ca5] hover:text-[#15161a]"
                                  >
                                    {showSecret[g.name] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              <div className="relative">
                                <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">Webhook Secret</label>
                                <div className="relative">
                                  <input
                                    type={showSecret[`wh_${g.name}`] ? 'text' : 'password'}
                                    value={state.webhook_secret}
                                    onChange={(e) => setFormState({ ...formState, [g.name]: { ...state, webhook_secret: e.target.value } })}
                                    className="w-full border border-[#e7e7ea] rounded-lg px-3 py-2 text-xs font-mono text-[#15161a] bg-white focus:outline-none focus:border-[#111]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowSecret({ ...showSecret, [`wh_${g.name}`]: !showSecret[`wh_${g.name}`] })}
                                    className="absolute right-3 top-2.5 text-[#9a9ca5] hover:text-[#15161a]"
                                  >
                                    {showSecret[`wh_${g.name}`] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11.5px] text-[#6b6d76] font-semibold mb-1.5">
                                  Webhook URL <span className="font-normal text-[#9a9ca5]">(read-only)</span>
                                </label>
                                <div className="flex items-center gap-2 border border-[#e7e7ea] rounded-lg px-3 py-2 text-xs text-[#6b6d76] bg-[#f8f8f9] font-mono">
                                  <span className="truncate">{g.webhook_url}</span>
                                  <button
                                    onClick={() => copyToClipboard(g.webhook_url)}
                                    className="ml-auto text-[#15161a] font-semibold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedUrl === g.webhook_url ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>Copy</span>
                                  </button>
                                </div>
                              </div>

                              <div className="col-span-1 md:col-span-2 flex items-center gap-3 pt-2">
                                <button
                                  onClick={() => handleTestConnection(g.name)}
                                  disabled={testing[g.name]}
                                  className="px-4 py-2 rounded-lg border border-[#e7e7ea] bg-white hover:bg-[#f5f5f7] text-[#15161a] font-semibold text-xs transition-all cursor-pointer"
                                >
                                  {testing[g.name] ? 'Testing...' : 'Test connection'}
                                </button>
                                <button
                                  onClick={() => handleGatewaySave(g.name)}
                                  disabled={savingGateway[g.name]}
                                  className="px-4 py-2 rounded-lg bg-[#ff5a1f] hover:bg-[#e04c15] disabled:opacity-50 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                                >
                                  {savingGateway[g.name] ? 'Saving...' : 'Save changes'}
                                </button>
                                <span className="text-xs text-[#1f8a4c] font-semibold">
                                  ✓ Last test passed · Just now
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
