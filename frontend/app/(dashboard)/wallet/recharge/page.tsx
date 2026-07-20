'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft, Shield, CreditCard, CheckCircle, RefreshCw, AlertCircle, Receipt } from 'lucide-react';
import Link from 'next/link';

declare global { interface Window { Razorpay: any; } }

export default function WalletRechargePage() {
  const [amount, setAmount] = useState('');
  const [config, setConfig] = useState<any>({
    gateway: 'razorpay',
    min_recharge: 500,
    max_recharge: 100000,
    presets: [500, 1000, 2000, 5000],
    fee_percent: 0,
    auto_gst_invoice: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rechargeReceipt, setRechargeReceipt] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiClient.get('/wallet/recharge/config');
      if (res.data.success) {
        setConfig(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load recharge config');
    }
  };

  const loadRazorpayScript = () =>
    new Promise<void>((resolve) => {
      if (document.getElementById('rzp-script')) return resolve();
      const s = document.createElement('script');
      s.id = 'rzp-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      document.body.appendChild(s);
    });

  const numAmount = parseFloat(amount || '0');
  const feeAmount = (numAmount * (config.fee_percent || 0)) / 100;
  const gstAmount = config.auto_gst_invoice ? (feeAmount * 0.18) : 0;
  const totalAmount = numAmount + feeAmount + gstAmount;

  const handleRecharge = async () => {
    if (!numAmount || numAmount < config.min_recharge) {
      setError(`Minimum recharge amount is ₹${config.min_recharge}`);
      return;
    }
    if (numAmount > config.max_recharge) {
      setError(`Maximum recharge amount limit is ₹${config.max_recharge.toLocaleString('en-IN')}`);
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data } = await apiClient.post('/wallet/recharge/initiate', { amount: numAmount });
      if (!data.success) throw new Error(data.error?.message || 'Failed to initiate recharge');

      const { recharge_id, checkout_params, gateway } = data.data;

      if (gateway === 'razorpay') {
        await loadRazorpayScript();
        const options = {
          key: checkout_params.key,
          amount: checkout_params.amount,
          currency: checkout_params.currency || 'INR',
          name: checkout_params.name || 'Nanoshipy',
          description: checkout_params.description || 'Wallet Recharge',
          order_id: checkout_params.order_id,
          handler: async (response: any) => {
            try {
              const verifyRes = await apiClient.post(`/wallet/recharge/${recharge_id}/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                setRechargeReceipt({
                  amount: numAmount,
                  recharge_id,
                  new_balance: verifyRes.data.data.new_balance,
                });
                setSuccess(true);
                setTimeout(() => router.push('/wallet'), 3000);
              } else {
                setError('Payment verification failed');
              }
            } catch (vErr: any) {
              setError(vErr.response?.data?.error?.message || 'Verification error');
            }
          },
          theme: { color: '#6366f1' },
          modal: { ondismiss: () => setLoading(false) },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setError(resp.error?.description || 'Payment failed at gateway');
          setLoading(false);
        });
        rzp.open();
      } else {
        // Manual verification flow
        const verifyRes = await apiClient.post(`/wallet/recharge/${recharge_id}/verify`, {});
        if (verifyRes.data.success) {
          setSuccess(true);
          setTimeout(() => router.push('/wallet'), 2500);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Wallet Credited Successfully!</h2>
          <p className="text-slate-500 text-sm">₹{numAmount.toFixed(2)} added to your wallet balance</p>
          {rechargeReceipt?.new_balance && (
            <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.06] text-xs">
              <span className="text-slate-400 font-medium">New Wallet Balance: </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{rechargeReceipt.new_balance.toFixed(2)}</span>
            </div>
          )}
          <p className="text-slate-400 text-xs mt-2 animate-pulse">Redirecting to wallet overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Money to Wallet</h1>
          <p className="text-slate-500 text-sm">Online instant recharge via UPI, Cards, Netbanking</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] p-6 space-y-6 shadow-sm">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Recharge Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₹</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              min={config.min_recharge}
              max={config.max_recharge}
              step={100}
              className="w-full pl-9 pr-4 py-3.5 text-2xl font-black text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.03] focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          {error && <p className="text-rose-500 text-xs mt-2 font-medium">{error}</p>}
        </div>

        {/* Quick Presets */}
        <div>
          <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Quick Preset Amounts</p>
          <div className="flex flex-wrap gap-2">
            {(config.presets || [500, 1000, 2000, 5000]).map((preset: number) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${amount === String(preset) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-indigo-500'}`}
              >
                + ₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {/* Fee & GST Breakdown */}
        {numAmount > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Wallet Credit Amount</span>
              <span className="font-bold text-slate-900 dark:text-white">₹{numAmount.toFixed(2)}</span>
            </div>
            {feeAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Convenience Fee ({config.fee_percent}%)</span>
                <span>₹{feeAmount.toFixed(2)}</span>
              </div>
            )}
            {gstAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST (18%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 dark:border-white/[0.06] pt-2 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
              <span>Total Payable</span>
              <span className="text-indigo-600 dark:text-indigo-400">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleRecharge}
          disabled={loading || !numAmount}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {loading ? 'Initiating Checkout...' : `Proceed to Pay ₹${totalAmount.toFixed(2)}`}
        </button>
      </div>

      <div className="flex items-center gap-3 text-slate-400 text-xs px-2">
        <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Secured by 256-bit SSL encryption. UPI, Credit/Debit Cards, Net Banking & Wallets accepted.</span>
      </div>
    </div>
  );
}
