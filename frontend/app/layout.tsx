import React from 'react';
import './globals.css';
import { AuthProvider } from '@/lib/authStore';
import { ThemeProvider } from '@/lib/themeStore';

export const metadata = {
  title: 'Nanoshipy — Seller Tenant Workspace',
  description: 'Elite multi-tenant courier aggregator seller workspace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                } catch (_) {}
              })();
            `
          }}
        />
      </head>
      <body className="bg-[#f4f6fa] text-[#0a0d14] antialiased font-['Inter',sans-serif] selection:bg-blue-600 selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
