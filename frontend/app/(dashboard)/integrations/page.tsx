'use client';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import { ShoppingBag, Globe, Key, Webhook, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';

function IntegrationCard({ title, description, icon: Icon, href, status, badge, lastSync }: {
  title: string; description: string; icon: React.ComponentType<any>; href: string;
  status?: 'connected' | 'disconnected' | null; badge?: string; lastSync?: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl bg-white border border-[#e2e6ef] p-5 hover:border-[#2563eb] hover:bg-[#eff6ff]/30 transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#f4f6fa] border border-[#e2e6ef]">
          <Icon className="w-5 h-5 text-[#2563eb]" />
        </div>
        {status && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
            ${status === 'connected'
              ? 'text-[#16a34a] bg-[#f0fdf4] border-[#bbf7d0]'
              : 'text-[#6b7280] bg-[#f4f6fa] border-[#e2e6ef]'}`}>
            {status === 'connected' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {status === 'connected' ? 'Connected' : 'Not Connected'}
          </span>
        )}
        {badge && <span className="text-xs font-semibold text-[#2563eb] bg-[#eff6ff] border border-[#bfdbfe] px-2.5 py-1 rounded-full">{badge}</span>}
      </div>
      <h3 className="text-[#0a0d14] font-bold text-base mb-1 group-hover:text-[#2563eb] transition-colors">{title}</h3>
      <p className="text-[#4b5563] text-xs leading-relaxed">{description}</p>
      {lastSync && (
        <p className="text-xs text-[#6b7280] mt-3 flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3 text-[#2563eb]" /> Last sync: {lastSync}
        </p>
      )}
      <div className="flex items-center gap-1 text-[#2563eb] text-xs font-semibold mt-4 group-hover:translate-x-1 transition-all">
        Manage Integration <ArrowRight className="w-4 h-4" />
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
    <div className="space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-[22px] font-bold text-[#0a0d14] tracking-tight">E-commerce & API Integrations</h1>
        <p className="text-[#4b5563] text-xs mt-0.5">Connect your store and configure APIs to automate order sync, webhooks, and tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <IntegrationCard
          title="Shopify Store"
          description="Sync orders, customer details, and inventory automatically via official Shopify OAuth App."
          icon={ShoppingBag}
          href="/integrations/shopify"
          status={shopify?.status === 'active' ? 'connected' : 'disconnected'}
          lastSync={shopify?.last_synced_at ? new Date(shopify.last_synced_at).toLocaleString() : undefined}
        />
        <IntegrationCard
          title="WooCommerce Store"
          description="Connect your WordPress WooCommerce store via REST API credentials for real-time order pull."
          icon={Globe}
          href="/integrations/woocommerce"
          status={woo?.status === 'active' ? 'connected' : 'disconnected'}
          lastSync={woo?.last_synced_at ? new Date(woo.last_synced_at).toLocaleString() : undefined}
        />
        <IntegrationCard
          title="REST API Access Keys"
          description="Programmatically create orders, fetch rates, and track shipments via secure bearer token API."
          icon={Key}
          href="/integrations/api"
          badge="Developer"
        />
        <IntegrationCard
          title="Webhook Notifications"
          description="Receive real-time HTTP callbacks for status changes, NDR events, and delivery confirmations."
          icon={Webhook}
          href="/integrations/webhooks"
          badge="Real-time"
        />
      </div>
    </div>
  );
}
