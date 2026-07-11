import React from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070b14] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-slate-650 dark:text-slate-400">
            Remembered it?{' '}
            <Link href="/login" className="font-semibold text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 hover:underline">
              Sign in here
            </Link>
          </p>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
