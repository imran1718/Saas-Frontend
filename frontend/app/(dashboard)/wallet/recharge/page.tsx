'use client';

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authStore';
import { apiClient } from '@/lib/apiClient';
import { RechargeForm } from '@/components/wallet/RechargeForm';
import { RazorpayCheckout } from '@/components/wallet/RazorpayCheckout';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

interface GatewayCheckoutInfo {
  recharge_order_id: string;
  gateway_order_id: string;
  amount: number;
  razorpay_key_id: string;
}

export default function RechargePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<GatewayCheckoutInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInitiateRecharge = async (amount: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/wallet/recharge', { amount });
      setCheckoutInfo(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to initiate recharge order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: { gateway_payment_id: string; gateway_signature: string }) => {
    if (!checkoutInfo) return;

    setLoading(true);
    try {
      await apiClient.post('/wallet/recharge/verify', {
        recharge_order_id: checkoutInfo.recharge_order_id,
        gateway_payment_id: paymentData.gateway_payment_id,
        gateway_signature: paymentData.gateway_signature,
      });

      toast.success('Wallet recharged successfully!');
      // Delay redirect to allow toast display
      setTimeout(() => {
        router.push('/wallet');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Payment verification failed. Please contact support.');
      setCheckoutInfo(null);
      setLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    toast.error('Payment cancelled by user');
    setCheckoutInfo(null);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center space-x-3 border-b pb-4">
        <Link
          href="/wallet"
          className="p-2 border rounded-xl hover:bg-gray-50 transition"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Add Wallet Funds</h1>
          <p className="text-xs text-gray-500">Secure digital payments for cargo shipping balance replenishment.</p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 flex items-start space-x-2">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!checkoutInfo ? (
        <RechargeForm
          onInitiateRecharge={handleInitiateRecharge}
          loading={loading}
        />
      ) : (
        <RazorpayCheckout
          rzpKeyId={checkoutInfo.razorpay_key_id}
          gatewayOrderId={checkoutInfo.gateway_order_id}
          amount={checkoutInfo.amount}
          customerName={user.name}
          customerEmail={user.email}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
