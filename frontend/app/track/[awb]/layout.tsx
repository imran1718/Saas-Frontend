import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Shipment | ShippingSaaS',
  description: 'Track your shipment in real time. Enter your AWB number to see the latest delivery updates.',
};

export default function PublicTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Minimal branded header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-tight">ShippingSaaS</span>
            <span className="text-blue-400 text-xs ml-2 font-medium">Shipment Tracker</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-white/10 mt-16 py-6 text-center">
        <p className="text-white/30 text-xs">
          Powered by ShippingSaaS · Shipment tracking is updated in real time
        </p>
      </footer>
    </div>
  );
}
