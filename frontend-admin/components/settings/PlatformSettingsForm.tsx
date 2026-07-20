'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { Save, Edit2, X, Check, Clock, User } from 'lucide-react';

interface PlatformSettingRow {
  id: string;
  setting_key: string;
  setting_value: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

const VALUE_TYPE_COLORS: Record<string, string> = {
  number: 'bg-blue-500/20 text-blue-300',
  boolean: 'bg-amber-500/20 text-amber-300',
  string: 'bg-slate-500/20 text-slate-400',
  json: 'bg-violet-500/20 text-violet-300',
};

export default function PlatformSettingsForm() {
  const [settings, setSettings] = useState<PlatformSettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/platform/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch {
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const startEdit = (row: PlatformSettingRow) => {
    setEditingKey(row.setting_key);
    setEditValue(row.setting_value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const saveEdit = async (key: string) => {
    setSaving(true);
    try {
      await apiClient.put(`/platform/settings/${key}`, { setting_value: editValue });
      toast.success(`Setting "${key}" updated`);
      setEditingKey(null);
      await fetchSettings();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to update setting';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Key</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Value</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Description</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Updated</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {settings.map(row => (
            <tr key={row.setting_key} className="hover:bg-white/3 transition">
              {/* Key */}
              <td className="px-4 py-3">
                <span className="font-mono text-slate-300 text-xs">{row.setting_key}</span>
              </td>

              {/* Value — inline editable */}
              <td className="px-4 py-3">
                {editingKey === row.setting_key ? (
                  <div className="flex items-center gap-2">
                    {row.value_type === 'boolean' ? (
                      <select
                        id={`platform-setting-edit-${row.setting_key}`}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="bg-slate-800 border border-violet-500/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        id={`platform-setting-edit-${row.setting_key}`}
                        type={row.value_type === 'number' ? 'number' : 'text'}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-40 bg-slate-800 border border-violet-500/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono"
                        autoFocus
                      />
                    )}
                    <button
                      onClick={() => saveEdit(row.setting_key)}
                      disabled={saving}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 text-slate-400 hover:bg-slate-500/20 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-white text-sm">{row.setting_value}</span>
                )}
              </td>

              {/* Type badge */}
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${VALUE_TYPE_COLORS[row.value_type] || VALUE_TYPE_COLORS.string}`}>
                  {row.value_type}
                </span>
              </td>

              {/* Description */}
              <td className="px-4 py-3 text-xs text-slate-400 max-w-[240px]">
                {row.description || '—'}
              </td>

              {/* Last updated */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {row.updated_at
                      ? new Date(row.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
              </td>

              {/* Edit button */}
              <td className="px-4 py-3">
                {editingKey !== row.setting_key && (
                  <button
                    id={`edit-setting-${row.setting_key}`}
                    onClick={() => startEdit(row)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 text-slate-300 hover:text-violet-300 rounded-lg transition"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
