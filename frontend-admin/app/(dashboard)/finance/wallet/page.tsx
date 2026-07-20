'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { RefreshCw, Zap, ShieldCheck, Download, Filter, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWalletPage() {
  const [activeTab, setActiveTab] = useState<'recharges' | 'adjustments'>('recharges');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    recharged_today: 184200,
    recharged_month: 4280000,
    pending_count: 4,
    failed_count: 1,
    success_rate: 97.6,
  });
  const [loading, setLoading] = useState(true);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const [sellers, setSellers] = useState<any[]>([]);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [adjType, setAdjType] = useState<'credit' | 'debit'>('credit');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [submittingAdj, setSubmittingAdj] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'recharges') {
        const res = await apiClient.get('/platform/wallet/recharge-transactions');
        if (res.data.success) {
          setTransactions(res.data.data.transactions || []);
          if (res.data.data.summary) setSummary(res.data.data.summary);
        }
      } else {
        const res = await apiClient.get('/platform/sellers');
        if (res.data.success) {
          setSellers(res.data.data.sellers || res.data.data || []);
        }
      }
    } catch {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (txId: string) => {
    if (!confirm('Force reconcile & credit this seller wallet?')) return;
    try {
      setReconcilingId(txId);
      const res = await apiClient.post(`/platform/wallet/recharge-transactions/${txId}/reconcile`);
      if (res.data.success) {
        toast.success('Transaction reconciled and credited!');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Reconciliation failed');
    } finally {
      setReconcilingId(null);
    }
  };

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSellerId || !adjAmount || Number(adjAmount) <= 0) {
      toast.error('Please select a seller and enter a valid amount');
      return;
    }
    try {
      setSubmittingAdj(true);
      const res = await apiClient.post(`/platform/sellers/${selectedSellerId}/wallet/adjust`, {
        type: adjType,
        amount: Number(adjAmount),
        reason: adjReason || 'Manual admin balance adjustment',
      });
      if (res.data.success) {
        toast.success(`Wallet ${adjType === 'credit' ? 'credited' : 'debited'} successfully!`);
        setShowAdjModal(false);
        setAdjAmount('');
        setAdjReason('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Adjustment failed');
    } finally {
      setSubmittingAdj(false);
    }
  };

  const PROVIDER_METADATA: Record<string, { logoText: string; logoBg: string; name: string }> = {
    razorpay: { logoText: 'R', logoBg: 'bg-[#0c2451]', name: 'Razorpay' },
    cashfree: { logoText: 'C', logoBg: 'bg-[#00b899]', name: 'Cashfree' },
    payu: { logoText: 'P', logoBg: 'bg-[#5f259f]', name: 'PayU' },
    manual: { logoText: 'M', logoBg: 'bg-[#6b6d76]', name: 'Bank transfer' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#15161a]">
      {/* Topbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#15161a]">Wallet</h1>
          <div className="text-xs text-[#6b6d76] mt-0.5">Finance → Wallet</div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAdjModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#111] hover:bg-[#26272e] text-white font-semibold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#ff5a1f]" />
            <span>Auto-credit stuck txns</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#e7e7ea]/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'adjustments' ? 'bg-white text-[#15161a] shadow-xs' : 'text-[#6b6d76] hover:text-[#15161a]'
          }`}
        >
          Seller balances
        </button>
        <button
          onClick={() => setActiveTab('recharges')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'recharges' ? 'bg-white text-[#15161a] shadow-xs' : 'text-[#6b6d76] hover:text-[#15161a]'
          }`}
        >
          Recharge transactions
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#e7e7ea] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#6b6d76] mb-2 font-medium">Recharged today</div>
          <div className="text-2xl font-bold text-[#15161a]">
            ₹{(summary.recharged_today || 184200).toLocaleString('en-IN')}
          </div>
          <div className="text-[11.5px] text-[#1f8a4c] font-semibold mt-1">▲ 12% vs yesterday</div>
        </div>

        <div className="bg-white border border-[#e7e7ea] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#6b6d76] mb-2 font-medium">Recharged this month</div>
          <div className="text-2xl font-bold text-[#15161a]">₹42.8L</div>
          <div className="text-[11.5px] text-[#6b6d76] font-medium mt-1">Across 3 gateways</div>
        </div>

        <div className="bg-white border border-[#e7e7ea] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#6b6d76] mb-2 font-medium">Success rate</div>
          <div className="text-2xl font-bold text-[#15161a]">{summary.success_rate || 97.6}%</div>
          <div className="text-[11.5px] text-[#6b6d76] font-medium mt-1">Last 30 days</div>
        </div>

        <div className="bg-white border border-[#e7e7ea] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#6b6d76] mb-2 font-medium">Pending / stuck</div>
          <div className="text-2xl font-bold text-[#15161a]">{summary.pending_count || 4}</div>
          <div className="text-[11.5px] text-[#a9720b] font-semibold mt-1">⚠ 1 older than 15 min</div>
        </div>
      </div>

      {/* Main Transactions Card */}
      {activeTab === 'recharges' ? (
        <div className="bg-white border border-[#e7e7ea] rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#eef0f2] flex items-center justify-between">
            <div>
              <h3 className="text-[14.5px] font-semibold text-[#15161a]">Recharge transactions</h3>
              <div className="text-xs text-[#6b6d76] mt-0.5">Every online wallet top-up, reconciled against the gateway</div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 border border-[#e7e7ea] rounded-lg px-3 py-1.5 text-xs text-[#3c3d43] font-medium hover:bg-[#fafafa]">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button className="flex items-center gap-1.5 border border-[#e7e7ea] rounded-lg px-3 py-1.5 text-xs text-[#3c3d43] font-medium hover:bg-[#fafafa]">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#6b6d76]">Loading recharge transactions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#eef0f2] text-[11px] uppercase tracking-wider text-[#9a9ca5] font-semibold">
                    <th className="py-2.5 px-4">Txn ID</th>
                    <th className="py-2.5 px-4">Seller</th>
                    <th className="py-2.5 px-4">Gateway</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Fee</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Gateway ref</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef0f2]">
                  {transactions.map((tx) => {
                    const gwName = tx.gateway_name?.toLowerCase() || 'razorpay';
                    const meta = PROVIDER_METADATA[gwName] || { logoText: 'R', logoBg: 'bg-[#0c2451]', name: 'Razorpay' };

                    return (
                      <tr key={tx.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[#15161a]">
                          WRT-{tx.id.substring(0, 5).toUpperCase()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#25262b]">
                          {tx.tenant?.company_name || 'TestCorp'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 font-semibold text-[#25262b]">
                            <div className={`w-5.5 h-5.5 rounded ${meta.logoBg} text-white font-bold text-[9px] flex items-center justify-center`}>
                              {meta.logoText}
                            </div>
                            <span>{meta.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#15161a]">
                          ₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-[#6b6d76]">
                          ₹0
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold inline-flex items-center gap-1.5 ${tx.status === 'success' ? 'bg-[#eaf7ee] text-[#1f8a4c]' : tx.status === 'initiated' || tx.status === 'pending' ? 'bg-[#fff6e0] text-[#a9720b]' : 'bg-[#fdecec] text-[#c53434]'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span className="capitalize">{tx.status === 'initiated' ? 'Initiated' : tx.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#6b6d76] text-[11px]">
                          {tx.gateway_payment_id || tx.gateway_order_id || '—'}
                        </td>
                        <td className="py-3 px-4 text-[#6b6d76]">
                          {new Date(tx.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {tx.status !== 'success' ? (
                            <button
                              onClick={() => handleReconcile(tx.id)}
                              disabled={reconcilingId === tx.id}
                              className="text-[#ff5a1f] hover:underline cursor-pointer"
                            >
                              Reconcile
                            </button>
                          ) : (
                            <span className="text-[#2f5fd6] cursor-pointer hover:underline">View</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Seller Balances Tab */
        <div className="bg-white border border-[#e7e7ea] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#eef0f2] text-[11px] uppercase tracking-wider text-[#9a9ca5] font-semibold">
                  <th className="py-2.5 px-4">Seller Company</th>
                  <th className="py-2.5 px-4">Subdomain</th>
                  <th className="py-2.5 px-4">Current Balance</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f2]">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#15161a]">{s.company_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[#6b6d76]">{s.subdomain}.nanoshipy.com</td>
                    <td className="py-3.5 px-4 font-bold text-[#1f8a4c] text-sm">
                      ₹{(s.wallet?.balance || s.balance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#eaf7ee] text-[#1f8a4c]">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSellerId(s.id);
                          setShowAdjModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#111] hover:bg-[#26272e] text-white font-semibold text-xs cursor-pointer"
                      >
                        Adjust balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-[#15161a]">Manual Admin Adjustment</h3>
              <button onClick={() => setShowAdjModal(false)} className="text-[#9a9ca5] hover:text-[#15161a]">✕</button>
            </div>
            <form onSubmit={handleManualAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6b6d76] mb-1">Select Seller</label>
                <select
                  value={selectedSellerId}
                  onChange={(e) => setSelectedSellerId(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs font-medium"
                >
                  <option value="">-- Choose Seller --</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>{s.company_name} ({s.subdomain})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6d76] mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('credit')}
                    className={`py-2 rounded-lg text-xs font-semibold border ${adjType === 'credit' ? 'bg-[#eaf7ee] text-[#1f8a4c] border-[#1f8a4c]' : 'bg-[#f5f5f7]'}`}
                  >
                    + Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('debit')}
                    className={`py-2 rounded-lg text-xs font-semibold border ${adjType === 'debit' ? 'bg-[#fdecec] text-[#c53434] border-[#c53434]' : 'bg-[#f5f5f7]'}`}
                  >
                    - Debit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6d76] mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full border rounded-lg p-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6d76] mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Manual credit for promo bonus"
                  className="w-full border rounded-lg p-2 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAdj}
                className="w-full bg-[#111] text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-[#26272e]"
              >
                {submittingAdj ? 'Processing...' : 'Confirm Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
