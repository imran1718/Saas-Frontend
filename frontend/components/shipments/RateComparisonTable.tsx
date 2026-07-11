import React from 'react';
import { Truck, Sparkles, Clock, CreditCard, ShieldCheck } from 'lucide-react';

export interface RateQuote {
  courier_provider_id: string;
  display_name: string;
  service_type: 'surface' | 'air' | 'express';
  price: number;
  cod_charge: number;
  estimated_days: number;
}

interface RateComparisonTableProps {
  rates: RateQuote[];
  selectedQuote: RateQuote | null;
  onSelectQuote: (rate: RateQuote) => void;
  booking: boolean;
}

export function RateComparisonTable({ rates, selectedQuote, onSelectQuote, booking }: RateComparisonTableProps) {
  if (rates.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-955/15 border border-amber-200 dark:border-amber-900/40 rounded-xl p-6 text-center text-sm text-amber-800 dark:text-amber-400">
        No rates available. Please check if there are active courier providers linked to your account.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Available Quotes ({rates.length})</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">Quotes are sorted from cheapest to most expensive</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rates.map((rate, index) => {
          const isSelected =
            selectedQuote?.courier_provider_id === rate.courier_provider_id &&
            selectedQuote?.service_type === rate.service_type;

          const isBestValue = index === 0;

          return (
            <div
              key={`${rate.courier_provider_id}-${rate.service_type}`}
              onClick={() => !booking && onSelectQuote(rate)}
              className={`relative border rounded-2xl p-5 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4 outline-none ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-[#131620]/80 ring-2 ring-indigo-650/10'
                  : 'border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#131620] hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-md'
              }`}
            >
              {isBestValue && (
                <span className="absolute -top-2.5 left-4 bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Cheapest</span>
                </span>
              )}

              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl ${
                  rate.service_type === 'express'
                    ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400'
                    : rate.service_type === 'air'
                    ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{rate.display_name}</h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                      rate.service_type === 'express'
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30'
                        : rate.service_type === 'air'
                        ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/30'
                        : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/30'
                    }`}>
                      {rate.service_type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Delivery in {rate.estimated_days} days</span>
                    </span>
                    {rate.cod_charge > 0 && (
                      <span className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-medium">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>COD Charge: ₹{rate.cod_charge.toFixed(2)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t border-slate-100 dark:border-white/[0.06] md:border-t-0 pt-3 md:pt-0">
                <div className="text-left md:text-right">
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Freight</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">₹{(rate.price + rate.cod_charge).toFixed(2)}</div>
                </div>

                <div className="flex items-center">
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#0f1117]'
                  }`}>
                    {isSelected && <ShieldCheck className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
