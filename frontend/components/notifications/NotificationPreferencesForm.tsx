'use client';

import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Save, ShieldAlert, Loader2, Sparkles } from 'lucide-react';

interface PreferenceRow {
  event_key: string;
  channel: string;
  is_enabled: boolean;
  is_locked: boolean;
}

const EVENT_DISPLAY_NAMES: Record<string, { title: string; category: string; description: string }> = {
  'order.created': {
    title: 'Order Created',
    category: 'Orders',
    description: 'Triggered when a new order is registered or imported.',
  },
  'order.status_changed': {
    title: 'Order Status Update',
    category: 'Orders',
    description: 'Triggered when order moves between pending and processing states.',
  },
  'shipment.created': {
    title: 'Shipment Booked',
    category: 'Shipping',
    description: 'Triggered when shipping labels and AWB are generated.',
  },
  'shipment.cancelled': {
    title: 'Shipment Cancelled',
    category: 'Shipping',
    description: 'Triggered when shipment booking is reverted and credited.',
  },
  'tracking.status_changed': {
    title: 'Delivery Milestones Scan',
    category: 'Shipping',
    description: 'SMS/WA notify key milestones (out for delivery, delivered, etc.).',
  },
  'ndr.created': {
    title: 'NDR Exception Opened',
    category: 'Delivery Failures (NDR & RTO)',
    description: 'Triggered when courier registers a delivery failure.',
  },
  'ndr.action_taken': {
    title: 'NDR Correction Update',
    category: 'Delivery Failures (NDR & RTO)',
    description: 'Triggered when reattempt/address changes are registered.',
  },
  'rto.initiated': {
    title: 'Return to Origin (RTO)',
    category: 'Delivery Failures (NDR & RTO)',
    description: 'Triggered when shipment can not be delivered and heads home.',
  },
  'wallet.low_balance': {
    title: 'Low Balance Warnings',
    category: 'Billing & Wallet',
    description: 'Triggered when wallet balance falls below the threshold.',
  },
};

export function NotificationPreferencesForm() {
  const [preferences, setPreferences] = useState<PreferenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/v1/notification-preferences', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const body = await res.json();
          setPreferences(body.data);
        }
      } catch (err) {
        showToast('Failed to load notification settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchPreferences();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggle = (eventKey: string, channel: string) => {
    setPreferences(prev =>
      prev.map(p =>
        p.event_key === eventKey && p.channel === channel && !p.is_locked
          ? { ...p, is_enabled: !p.is_enabled }
          : p
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      // Exclude locked inapp values since backend does not allow overriding them
      const payload = preferences
        .filter(p => p.channel !== 'inapp')
        .map(({ event_key, channel, is_enabled }) => ({
          event_key,
          channel,
          is_enabled,
        }));

      const res = await fetch('http://localhost:5000/api/v1/notification-preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: payload }),
      });

      if (res.ok) {
        showToast('Notification configurations saved successfully!', 'success');
      } else {
        throw new Error('Save configuration failed');
      }
    } catch {
      showToast('Failed to save settings configurations.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Group events by category
  const categories = Array.from(new Set(Object.values(EVENT_DISPLAY_NAMES).map(v => v.category)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400 font-medium">Resolving configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 flex items-center gap-2 p-4 rounded-xl shadow-2xl z-50 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {toast.message}
        </div>
      )}

      {/* Intro Header Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#131620]/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Notification Center Settings
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-normal max-w-xl">
            Configure preference toggles across channels. In-app alerts are delivered by default to your notifications bell widget.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed outline-none"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save Toggles
        </button>
      </div>

      {/* Preferences Grid Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#131620]/20 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.06] shadow-sm">
        {categories.map(category => {
          // Get events inside this category
          const eventKeys = Object.keys(EVENT_DISPLAY_NAMES).filter(
            k => EVENT_DISPLAY_NAMES[k].category === category
          );

          return (
            <div key={category} className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {category}
              </h3>

              <div className="space-y-4 divide-y divide-slate-100 dark:divide-white/[0.04]">
                {eventKeys.map(eventKey => {
                  const info = EVENT_DISPLAY_NAMES[eventKey];

                  return (
                    <div
                      key={eventKey}
                      className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="max-w-md">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {info.title}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-normal leading-relaxed">
                          {info.description}
                        </p>
                      </div>

                      {/* Channels Toggles */}
                      <div className="flex items-center gap-6 sm:gap-8">
                        {['email', 'sms', 'whatsapp'].map(channel => {
                          const pref = preferences.find(
                            p => p.event_key === eventKey && p.channel === channel
                          );
                          const isEnabled = pref ? pref.is_enabled : true;

                          return (
                            <div key={channel} className="flex flex-col items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {channel === 'whatsapp' ? 'WhatsApp' : channel}
                              </span>
                              <button
                                onClick={() => handleToggle(eventKey, channel)}
                                className={`transition-all duration-200 focus:outline-none ${
                                  isEnabled ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300' : 'text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500'
                                }`}
                              >
                                {isEnabled ? (
                                  <ToggleRight className="w-8 h-8 stroke-[1.5]" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 stroke-[1.5]" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
