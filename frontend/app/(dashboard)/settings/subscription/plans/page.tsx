'use client';

'use client';

import React, { useState, useEffect } from 'react';
import { PlanCard, PlanDetails } from '@/components/subscription/PlanCard';
import { PlanComparisonTable } from '@/components/subscription/PlanComparisonTable';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ComparePlansPage() {
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlansAndSubscription();
  }, []);

  const fetchPlansAndSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      // Fetch comparison list
      const plansRes = await fetch('http://localhost:5000/api/v1/subscription/plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subscriptionRes = await fetch('http://localhost:5000/api/v1/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!plansRes.ok || !subscriptionRes.ok) {
        throw new Error('Failed to fetch plan list configurations');
      }

      const plansBody = await plansRes.json();
      const subBody = await subscriptionRes.json();

      setPlans(plansBody.data);
      setCurrentPlanId(subBody.data.plan.id);
      setCycle(subBody.data.billing_cycle);
      if (subBody.data.pending_plan) {
        setPendingPlanId(subBody.data.pending_plan.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred loading catalogue');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, planCycle: 'monthly' | 'yearly') => {
    const selected = plans.find(p => p.id === planId);
    if (!selected) return;

    const confirmationMsg = selected.price_monthly === 0
      ? `Are you sure you want to change to ${selected.name}?`
      : `Changing subscription plan to ${selected.name} (${planCycle} cycle). Proceed?`;

    if (!window.confirm(confirmationMsg)) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch('http://localhost:5000/api/v1/subscription/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: planCycle,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || 'Failed to update plan tier');
      }

      alert(body.data.effective === 'deferred' 
        ? `Downgrade scheduled! It will take effect at the end of the billing period.`
        : `Upgrade completed! Prorated fee debited from your virtual wallet.`
      );
      
      fetchPlansAndSubscription();
    } catch (err: any) {
      alert(err.message || 'Payment upgrade transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <Link href="/settings/subscription" className="inline-flex items-center text-xs text-blue-600 font-bold hover:underline mb-2">
            <ArrowLeft className="h-4.5 w-4.5 mr-1" />
            <span>Back to overview</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compare Pricing Plans</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose the subscription plan that aligns with your monthly shipment volume.
          </p>
        </div>

        {/* Cycle Toggle Switch */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setCycle('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              cycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              cycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Yearly (Save 15%)
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === currentPlanId}
            isPending={plan.id === pendingPlanId}
            cycle={cycle}
            onSelect={handleSelectPlan}
            loading={submitting}
          />
        ))}
      </div>

      {/* Comparison Grid section */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-black text-slate-800 tracking-tight">Compare Feature Matrix</h3>
        <PlanComparisonTable plans={plans} />
      </div>
    </div>
  );
}
