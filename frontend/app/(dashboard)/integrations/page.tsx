'use client';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import { ShoppingBag, Globe, Key, Webhook, ArrowRight, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';

function IntegrationCard({ title, description, icon: Icon, href, status, badge, lastSync }: {
  title: string; description: string; icon: React.ComponentType<any>; href: string;
  status?: 'connected' | 'disconnected' | null; badge?: string; lastSync?: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] p-5 hover:border-indigo-500/40 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/5 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05]">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
        {status && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
            ${status === 'connected'
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
              : 'text-slate-500 bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.08]'}`}>
            {status === 'connected' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {status === 'connected' ? 'Connected' : 'Not Connected'}
          </span>
        )}
        {badge && <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-full">{badge}</span>}
      </div>
      <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      {lastSync && (
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Last sync: {lastSync}
        </p>
      )}
      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        Manage <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/integrations/storefront').then(({ data }) => {
      if (data.success) setConnections(data.data || []);
    }).catch(() => {});
  }, []);

  const shopify = connections.find(c => c.platform === 'shopify');
  const woo = connections.find(c => c.platform === 'woocommerce');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations</h1>
        <p className="text-slate-500 text-sm mt-0.5">Connect your store and configure APIs to automate your workflow</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Store Connections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            title="Shopify" description="Import orders automatically from your Shopify store via webhooks"
            icon={ShoppingBag} href="/integrations/shopify"
            status={shopify ? shopify.status : 'disconnected'}
            lastSync={shopify?.last_synced_at ? new Date(shopify.last_synced_at).toLocaleString('en-IN') : undefined}
          />
          <IntegrationCard
            title="WooCommerce" description="Sync orders from your WooCommerce-powered store"
            icon={Globe} href="/integrations/woocommerce"
            status={woo ? woo.status : 'disconnected'}
            lastSync={woo?.last_synced_at ? new Date(woo.last_synced_at).toLocaleString('en-IN') : undefined}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Developer Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard title="API Keys" description="Manage API keys and access tokens for the Nanoshipy public API" icon={Key} href="/integrations/api" badge="3 active" />
          <IntegrationCard title="Webhooks" description="Register HTTPS endpoints to receive real-time event notifications" icon={Webhook} href="/integrations/webhooks" badge="2 subscriptions" />
        </div>
      </div>
    </div>
  );
}
