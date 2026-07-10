import React from 'react';
import './globals.css';
import { AuthProvider } from '@/lib/authStore';

export const metadata = {
  title: 'ShippingSaaS',
  description: 'Multi-tenant shipping aggregator platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
