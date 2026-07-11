'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Package, MapPin, AlertTriangle, Clock, CheckCircle2,
  Truck, LocateFixed, ArrowDownToLine, BoxIcon, XCircle, Search
} from 'lucide-react';

interface TrackingEvent {
  id: string;
  status: string;
  raw_status: string;
  location: string | null;
  remark: string | null;
  event_timestamp: string;
  source: string;
}

interface PublicTrackingData {
  awb_number: string;
  current_status: string;
  is_delayed: boolean;
  estimated_delivery_date: string | null;
  provider: {
    display_name: string;
    logo_url: string | null;
  } | null;
  events: TrackingEvent[];
}

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; glow: string;
  icon: React.ReactNode; progressStep: number;
}> = {
  created:           { label: 'Order Created',        color: 'text-slate-300',   bg: 'bg-slate-800',  border: 'border-slate-600', glow: '',                            icon: <BoxIcon className="h-5 w-5" />,           progressStep: 1 },
  awb_generated:     { label: 'AWB Generated',         color: 'text-blue-300',    bg: 'bg-blue-900/50',  border: 'border-blue-700', glow: 'shadow-blue-500/20',          icon: <Package className="h-5 w-5" />,           progressStep: 2 },
  pickup_scheduled:  { label: 'Pickup Scheduled',      color: 'text-indigo-300',  bg: 'bg-indigo-900/50',border: 'border-indigo-700', glow: 'shadow-indigo-500/20',        icon: <Clock className="h-5 w-5" />,             progressStep: 3 },
  picked_up:         { label: 'Picked Up',             color: 'text-violet-300',  bg: 'bg-violet-900/50',border: 'border-violet-700',glow: 'shadow-violet-500/20',        icon: <ArrowDownToLine className="h-5 w-5" />,   progressStep: 4 },
  in_transit:        { label: 'In Transit',            color: 'text-amber-300',   bg: 'bg-amber-900/50', border: 'border-amber-700', glow: 'shadow-amber-500/20',         icon: <Truck className="h-5 w-5" />,             progressStep: 5 },
  out_for_delivery:  { label: 'Out for Delivery',      color: 'text-orange-300',  bg: 'bg-orange-900/50',border: 'border-orange-700',glow: 'shadow-orange-500/20',        icon: <LocateFixed className="h-5 w-5" />,       progressStep: 6 },
  delivered:         { label: 'Delivered ✓',           color: 'text-emerald-300', bg: 'bg-emerald-900/50',border: 'border-emerald-700',glow: 'shadow-emerald-500/30',    icon: <CheckCircle2 className="h-5 w-5" />,      progressStep: 7 },
  cancelled:         { label: 'Cancelled',             color: 'text-red-300',     bg: 'bg-red-900/50',   border: 'border-red-700',   glow: '',                            icon: <XCircle className="h-5 w-5" />,           progressStep: 0 },
  failed:            { label: 'Delivery Failed',       color: 'text-red-400',     bg: 'bg-red-900/50',   border: 'border-red-700',   glow: '',                            icon: <AlertTriangle className="h-5 w-5" />,     progressStep: 0 },
};

const STEPS = ['created', 'awb_generated', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];

function ProgressBar({ currentStatus }: { currentStatus: string }) {
  const stepIndex = STEPS.indexOf(currentStatus);
  const isTerminal = ['cancelled', 'failed'].includes(currentStatus);

  return (
    <div className="flex items-center space-x-1 my-6">
      {STEPS.map((step, i) => {
        const active = i <= stepIndex && !isTerminal;
        const current = i === stepIndex && !isTerminal;
        return (
          <React.Fragment key={step}>
            <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              active ? 'bg-blue-500' : 'bg-white/10'
            } ${current ? 'ring-2 ring-blue-400/50' : ''}`} />
            {i < STEPS.length - 1 && (
              <div className={`h-1 w-1 rounded-full ${active ? 'bg-blue-400' : 'bg-white/20'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PublicTrackingPage() {
  const { awb } = useParams() as { awb: string };
  const [data, setData] = useState<PublicTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!awb) return;
    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/track/${awb}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.data) {
          throw new Error(json.error?.message || 'Tracking information not found');
        }
        setData(json.data);
      })
      .catch((err) => {
        setError(err.message || 'Could not retrieve tracking information');
      })
      .finally(() => setLoading(false));
  }, [awb]);

  const cfg = data ? (STATUS_CONFIG[data.current_status] || STATUS_CONFIG['in_transit']) : null;

  return (
    <div className="space-y-6">
      {/* AWB Hero */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-xs text-white/60 font-medium mb-4">
          <Search className="h-3 w-3" />
          <span>Tracking AWB</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight font-mono">{awb}</h1>
        {data?.provider && (
          <p className="text-white/50 text-sm">via {data.provider.display_name}</p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-blue-400 rounded-full animate-spin border-t-transparent" />
          </div>
          <p className="text-white/50 text-sm">Fetching latest tracking updates...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />
          <h2 className="text-white font-bold text-lg">Tracking Not Found</h2>
          <p className="text-red-300/80 text-sm max-w-sm mx-auto">{error}</p>
          <p className="text-white/30 text-xs">Please verify your AWB number or contact the sender.</p>
        </div>
      )}

      {data && cfg && !loading && (
        <>
          {/* Current Status Hero Card */}
          <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-6 shadow-xl ${cfg.glow ? `shadow-lg ${cfg.glow}` : ''}`}>
            <div className="flex items-center space-x-4">
              <div className={`h-14 w-14 rounded-2xl bg-black/20 flex items-center justify-center ${cfg.color} shadow-inner`}>
                {cfg.icon}
              </div>
              <div className="flex-1">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">Current Status</p>
                <h2 className={`text-xl font-black ${cfg.color}`}>{cfg.label}</h2>
                {data.estimated_delivery_date && (
                  <p className="text-white/40 text-xs mt-1">
                    Estimated Delivery: {new Date(data.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              {data.is_delayed && (
                <div className="flex items-center space-x-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-300 text-xs font-bold">DELAYED</span>
                </div>
              )}
            </div>

            <ProgressBar currentStatus={data.current_status} />
          </div>

          {/* Tracking Events Timeline */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-white/80 font-bold text-sm">Shipment Journey</h3>
              <p className="text-white/30 text-xs mt-0.5">{data.events.length} checkpoint{data.events.length !== 1 ? 's' : ''} recorded</p>
            </div>

            {data.events.length === 0 ? (
              <div className="py-12 text-center">
                <Truck className="h-8 w-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No checkpoints yet. Updates will appear here once the shipment moves.</p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-0">
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[10px] top-3 bottom-3 w-[1px] bg-gradient-to-b from-blue-500/50 via-white/10 to-transparent" />

                  {data.events.map((event, index) => {
                    const evCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG['in_transit'];
                    const isLatest = index === 0;

                    return (
                      <div key={event.id} className="relative flex items-start space-x-4 pb-6 last:pb-0">
                        {/* Dot */}
                        <div className={`relative z-10 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5 ${
                          isLatest ? `${evCfg.bg} border ${evCfg.border} shadow-lg` : 'bg-white/10 border border-white/20'
                        }`}>
                          <div className={`h-2 w-2 rounded-full ${isLatest ? 'bg-blue-400' : 'bg-white/30'}`} />
                        </div>

                        {/* Event */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-1">
                            <span className={`text-sm font-bold ${isLatest ? evCfg.color : 'text-white/60'}`}>
                              {evCfg.label}
                            </span>
                            <span className="text-[11px] text-white/30 shrink-0">
                              {formatDateTime(event.event_timestamp)}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin className="h-3 w-3 text-white/30 shrink-0" />
                              <span className="text-[12px] text-white/50">{event.location}</span>
                            </div>
                          )}

                          {event.remark && (
                            <p className="text-[12px] text-white/40 mt-1 leading-relaxed">{event.remark}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
