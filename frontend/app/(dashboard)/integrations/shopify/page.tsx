'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ShoppingBag, RefreshCw, CheckCircle2, Trash2, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ShopifyIntegrationPage() {
  const [connection, setConnection] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [storeDomain, setStoreDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    fetchConnection();
  }, []);

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/integrations/storefront');
      if (res.data.success) {
        const shopify = (res.data.data || []).find((c: any) => c.platform === 'shopify');
        setConnection(shopify || null);
        if (shopify) {
          fetchLogs(shopify.id);
        }
      }
    } catch (err) {
      toast.error('Failed to load Shopify connection state');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (id: string) => {
    try {
      const res = await apiClient.get(`/integrations/storefront/${id}/logs`);
      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      // optional
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeDomain || !accessToken) {
      toast.error('Please enter your Shopify myshopify.com domain and Access Token');
      return;
    }
    try {
      setSaving(true);
      const res = await apiClient.post('/integrations/storefront', {
        platform: 'shopify',
        store_url: storeDomain.includes('myshopify.com') ? storeDomain : `${storeDomain}.myshopify.com`,
        credentials: {
          access_token: accessToken,
        },
      });

      if (res.data.success) {
        toast.success('Shopify store connected successfully!');
        setConnection(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to connect Shopify store');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!connection) return;
    try {
      setSyncing(true);
      const res = await apiClient.post(`/integrations/storefront/${connection.id}/sync`);
      if (res.data.success) {
        toast.success('Shopify order sync triggered!');
        fetchLogs(connection.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    if (!confirm('Are you sure you want to disconnect this Shopify store?')) return;
    try {
      await apiClient.delete(`/integrations/storefront/${connection.id}`);
      toast.success('Shopify store disconnected');
      setConnection(null);
      setLogs([]);
    } catch (err) {
      toast.error('Failed to disconnect store');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center gap-3">
        <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
        <span className="text-sm text-slate-500">Loading Shopify integration...</span>
      </div>
    );
  }

  const webhookUrl = connection ? `http://localhost:5000/api/v1/storefront/webhooks/${connection.id}` : '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Back link */}
      <Link href="/integrations" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Integrations
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shopify Integration</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Seamlessly import orders and push fulfillment status to Shopify</p>
          </div>
        </div>

        {connection && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Orders Now'}
            </button>
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Disconnect
            </button>
          </div>
        )}
      </div>

      {connection ? (
        /* Connected View */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#131620] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Shopify Connected & Active</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04]">
                <p className="text-slate-500 dark:text-slate-400">Shop Domain</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{connection.store_url || connection.subdomain || 'Shopify Store'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04]">
                <p className="text-slate-500 dark:text-slate-400">Last Sync</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString('en-IN') : 'Never'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04]">
                <p className="text-slate-500 dark:text-slate-400">Integration Method</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">Shopify Admin API + Webhooks</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Shopify Orders Webhook Endpoint
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                To receive automatic order notifications when orders are placed, set up a webhook in <strong>Shopify Admin &gt; Settings &gt; Notifications &gt; Webhooks</strong> (Event: Order creation):
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-[#090b10] border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono select-all">
                  {webhookUrl}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Webhook URL copied!'); }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition-all shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Sync Logs */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#131620] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Recent Sync Logs
            </h2>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No sync logs recorded yet. Click "Sync Orders Now" to run your first sync.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Orders Processed</th>
                      <th className="py-2.5 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {logs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{new Date(log.created_at || log.timestamp).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                            {(log.status || 'SUCCESS').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">{log.orders_count || log.count || 0}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{log.message || log.details || 'Sync completed cleanly'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Form */
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#131620] shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Connect Your Shopify Store</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Generate a Custom App Access Token in Shopify Admin under <strong>Settings &gt; Apps and sales channels &gt; Develop apps</strong> with `read_orders` & `write_fulfillments` scopes.</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shopify Store Domain (.myshopify.com)</label>
              <input
                type="text"
                required
                placeholder="your-store-name.myshopify.com"
                value={storeDomain}
                onChange={(e) => setStoreDomain(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Admin API Access Token (shpat_...)</label>
              <input
                type="password"
                required
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-semibold text-xs shadow-lg transition-all"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {saving ? 'Connecting Store...' : 'Connect Shopify Store'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
