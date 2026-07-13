'use client';
import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft, Shield, CreditCard, CheckCircle } from 'lucide-react';
import Link from 'next/link';

declare global { interface Window { Razorpay: any; } }

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function WalletRechargePage() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const loadRazorpayScript = () =>
    new Promise<void>((resolve) => {
      if (document.getElementById('rzp-script')) return resolve();
      const s = document.createElement('script');
      s.id = 'rzp-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      document.body.appendChild(s);
    });

  const handleRecharge = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) { setError('Minimum recharge amount is ₹100'); return; }
    if (amt > 100000) { setError('Maximum recharge amount is ₹1,00,000'); return; }
    setError('');
    setLoading(true);

    try {
      await loadRazorpayScript();
      const { data } = await apiClient.post('/wallet/recharge/initiate', { amount_rupees: amt });
      if (!data.success) throw new Error(data.message || 'Failed to initiate recharge');

      const { razorpayOrderId, amountPaise, keyId } = data.data;

      const options = {
        key: keyId,
        amount: amountPaise,
        currency: 'INR',
        name: 'Nanoshipy',
        description: 'Wallet Recharge',
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          await apiClient.post('/wallet/recharge/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setSuccess(true);
          setTimeout(() => router.push('/wallet'), 2500);
        },
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setError(resp.error?.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-slate-400">₹{parseFloat(amount).toFixed(2)} added to your wallet</p>
          <p className="text-slate-600 text-sm mt-2">Redirecting to wallet…</p>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Credits</h1>
          <p className="text-slate-500 text-sm">Recharge your Nanoshipy wallet</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] p-6 space-y-6">
        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Enter Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">₹</span>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" min={100} max={100000} step={100}
              className="w-full pl-9 pr-4 py-4 text-2xl font-bold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.03] focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Quick amounts */}
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium">Quick Select</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_AMOUNTS.map(preset => (
              <button key={preset} onClick={() => setAmount(preset.toString())}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                  ${amount === String(preset)
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-indigo-400'}`}>
                ₹{preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRecharge}
          disabled={loading || !amount}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white font-semibold text-base transition-all shadow-lg shadow-indigo-500/25"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
          ) : (
            <><CreditCard className="w-5 h-5" /> Pay ₹{parseFloat(amount || '0').toFixed(2)} via Razorpay</>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 text-slate-400 text-xs">
        <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <span>All payments are secured via Razorpay. UPI, Credit/Debit Cards, Net Banking, and Wallets accepted.</span>
      </div>
    </div>
  );
}
