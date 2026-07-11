import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-[#131620] shadow rounded-xl overflow-hidden border border-slate-200/50 dark:border-white/[0.06] ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-5 border-b border-slate-100 dark:border-white/[0.06] ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-5 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-4 bg-slate-50/50 dark:bg-[#10121a]/50 border-t border-slate-100 dark:border-white/[0.06] ${className}`}>
    {children}
  </div>
);
