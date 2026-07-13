'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

// Widgets
import OrdersTrendChart from '@/components/analytics/OrdersTrendChart';
import CourierPerformanceTable from '@/components/analytics/CourierPerformanceTable';
import ZoneDistributionMap from '@/components/analytics/ZoneDistributionMap';
import CodPrepaidSplitChart from '@/components/analytics/CodPrepaidSplitChart';
import WalletSpendChart from '@/components/analytics/WalletSpendChart';
import NdrRtoTrendChart from '@/components/analytics/NdrRtoTrendChart';
import ReportExportButton from '@/components/analytics/ReportExportButton';

export default function AnalyticsPage() {
  // Default range: last 30 days
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  const [dateFrom, setDateFrom] = useState(defaultFrom.toISOString().substring(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().substring(0, 10));
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Loading and State
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [ordersTrend, setOrdersTrend] = useState<any[]>([]);
  const [courierPerf, setCourierPerf] = useState<any[]>([]);
  const [zoneDist, setZoneDist] = useState<any[]>([]);
  const [paymentSplit, setPaymentSplit] = useState<any>(null);
  const [walletSpend, setWalletSpend] = useState<any[]>([]);
  const [ndrRtoTrend, setNdrRtoTrend] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const params = { date_from: dateFrom, date_to: dateTo };

    try {
      const [
        overviewRes,
        trendRes,
        courierRes,
        zoneRes,
        paymentRes,
        walletRes,
        ndrRes
      ] = await Promise.all([
        apiClient.get('/analytics/overview', { params }),
        apiClient.get('/analytics/orders-trend', { params: { ...params, granularity } }),
        apiClient.get('/analytics/courier-performance', { params }),
        apiClient.get('/analytics/zone-distribution', { params }),
        apiClient.get('/analytics/payment-split', { params }),
        apiClient.get('/analytics/wallet-spend', { params }),
        apiClient.get('/analytics/ndr-rto-trend', { params: { ...params, granularity } })
      ]);

      setOverview(overviewRes.data.data);
      setOrdersTrend(trendRes.data.data);
      setCourierPerf(courierRes.data.data);
      setZoneDist(zoneRes.data.data);
      setPaymentSplit(paymentRes.data.data);
      setWalletSpend(walletRes.data.data);
      setNdrRtoTrend(ndrRes.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFrom, dateTo, granularity]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-xs text-gray-500">Monitor order flows, courier efficiency, wallet spendings, and RTO ratios</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Granularity Selection */}
          <div className="bg-gray-100 p-0.5 rounded-xl flex space-x-1">
            {(['daily', 'weekly', 'monthly'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
                  granularity === g 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Date Picker Range */}
          <div className="flex items-center space-x-2 bg-white border border-gray-200/80 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-gray-700 w-28"
            />
            <span className="text-xs text-gray-400 font-bold">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-gray-700 w-28"
            />
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-xl text-gray-500 hover:text-gray-700 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <ReportExportButton />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', value: overview?.orders_count ?? '...', color: 'text-blue-600' },
          { label: 'Delivered Consignments', value: overview?.delivered_count ?? '...', color: 'text-emerald-600' },
          { label: 'Delivery Success Rate', value: overview ? `${overview.delivery_success_rate}%` : '...', color: 'text-indigo-600' },
          { label: 'Net Wallet Spend', value: overview ? `₹${overview.shipping_spend?.toLocaleString('en-IN')}` : '...', color: 'text-rose-600' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              {stat.label}
            </span>
            <h4 className={`text-2xl font-black ${stat.color} mt-1.5`}>
              {loading ? '...' : stat.value}
            </h4>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrdersTrendChart data={ordersTrend} />
        </div>
        <div>
          <CodPrepaidSplitChart data={paymentSplit} />
        </div>
      </div>

      {/* Spends and Region Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletSpendChart data={walletSpend} />
        <ZoneDistributionMap data={zoneDist} />
      </div>

      {/* Exceptions Rate Trend */}
      <div className="grid grid-cols-1 gap-6">
        <NdrRtoTrendChart data={ndrRtoTrend} />
      </div>

      {/* Courier Performance Table */}
      <div className="grid grid-cols-1 gap-6">
        <CourierPerformanceTable data={courierPerf} />
      </div>
    </div>
  );
}
