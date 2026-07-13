'use client';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Webhook, Plus, Trash2, TestTube, CheckCircle, XCircle, ToggleLeft, ToggleRight, Copy, Eye, EyeOff } from 'lucide-react';

const AVAILABLE_EVENTS = [
  { value: 'order.created', label: 'Order Created' },
  { value: 'order.updated', label: 'Order Updated' },
  { value: 'shipment.created', label: 'Shipment Created' },
  { value: 'shipment.dispatched', label: 'Shipment Dispatched' },
  { value: 'shipment.delivered', label: 'Shipment Delivered' },
  { value: 'shipment.rto_initiated', label: 'RTO Initiated' },
  { value: 'ndr.raised', label: 'NDR Raised' },
  { value: 'wallet.recharged', label: 'Wallet Recharged' },
  { value: 'wallet.debited', label: 'Wallet Debited' },
];

function CreateWebhookModal({ onClose, onCreate }: { onClose: () => void; onCreate: (wh: any) => void }) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (event: string) =>
    setEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);

  const handleCreate = async () => {
    if (!url.startsWith('https://')) { setError('URL must start with https://'); return; }
    if (events.length === 0) { setError('Select at least one event'); return; }
    setSaving(true);
    try {
      const { data } = await apiClient.post('/seller-webhooks', { url, events, description });
      if (data.success) onCreate(data.data);
      else setError(data.message || 'Failed to create webhook');
    } catch (err: any) { setError(err.response?.data?.message || 'Error creating webhook'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1120] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-white font-semibold">Add Webhook Endpoint</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Endpoint URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="My webhook"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Events to subscribe *</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map(ev => (
                <label key={ev.value} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all
                  ${events.includes(ev.value) ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-white/[0.06] text-slate-400 hover:border-white/[0.15]'}`}>
                  <input type="checkbox" className="sr-only" checked={events.includes(ev.value)} onChange={() => toggle(ev.value)} />
                  <span className="text-xs font-medium">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all">
            {saving ? 'Creating…' : 'Create Webhook'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, any>>({});

  useEffect(() => {
    apiClient.get('/seller-webhooks').then(({ data }) => {
      if (data.success) setWebhooks(data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreated = (wh: any) => {
    setWebhooks(prev => [wh, ...prev]);
    if (wh.secret) setNewSecret({ id: wh.id, secret: wh.secret });
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook?')) return;
    await apiClient.delete(`/seller-webhooks/${id}`);
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    const { data } = await apiClient.post(`/seller-webhooks/${id}/test`);
    setTestResult(prev => ({ ...prev, [id]: data.data }));
    setTesting(null);
  };

  return (
    <div className="space-y-6">
      {showCreate && <CreateWebhookModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Webhooks</h1>
          <p className="text-slate-500 text-sm mt-0.5">Receive real-time events at your HTTPS endpoints</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" /> Add Endpoint
        </button>
      </div>

      {/* Secret reveal banner */}
      {newSecret && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex-1">
            <p className="text-amber-400 font-semibold text-sm mb-1">⚠️ Save your signing secret — it won't be shown again</p>
            <code className="block font-mono text-xs text-amber-300 bg-amber-500/10 px-3 py-2 rounded-xl mt-2 break-all">{newSecret.secret}</code>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(newSecret.secret); }}
            className="flex-shrink-0 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-all">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={() => setNewSecret(null)} className="text-amber-500 hover:text-amber-300 text-lg leading-none">✕</button>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
          ))
        ) : webhooks.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] p-12 text-center">
            <Webhook className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No webhooks yet</p>
            <p className="text-slate-500 text-sm mt-1">Add an endpoint to start receiving events</p>
          </div>
        ) : webhooks.map(wh => (
          <div key={wh.id} className="rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wh.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <code className="text-slate-800 dark:text-slate-200 text-sm font-mono truncate">{wh.endpoint_url}</code>
                </div>
                {wh.description && <p className="text-slate-500 text-xs mb-2">{wh.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {(wh.events || []).map((ev: string) => (
                    <span key={ev} className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono">{ev}</span>
                  ))}
                </div>
                {testResult[wh.id] && (
                  <p className={`text-xs mt-2 flex items-center gap-1.5 ${testResult[wh.id].success ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {testResult[wh.id].success ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {testResult[wh.id].success ? `Test successful (HTTP ${testResult[wh.id].status})` : `Test failed: ${testResult[wh.id].error}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleTest(wh.id)} disabled={testing === wh.id}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  title="Send test event">
                  {testing === wh.id ? <div className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <TestTube className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(wh.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Delete webhook">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
