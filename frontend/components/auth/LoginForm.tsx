'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validators';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const LoginForm = () => {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMsg('');
    try {
      const response = await apiClient.post('/auth/login', data);
      const resData = response.data;

      if (resData.success) {
        if (resData.data.requires_2fa) {
          // Redirect to 2fa page and pass temp token (could use URL query or state)
          router.push(`/two-factor?token=${resData.data.temp_token}`);
        } else {
          setAuth(resData.data.user, resData.data.access_token);
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMsg && <Alert type="error" message={errorMsg} />}
      
      <Input 
        label="Subdomain" 
        {...register('subdomain')} 
        error={errors.subdomain?.message} 
        placeholder="your-company"
      />
      
      <Input 
        label="Email" 
        type="email" 
        {...register('email')} 
        error={errors.email?.message} 
      />
      
      <Input 
        label="Password" 
        type="password" 
        {...register('password')} 
        error={errors.password?.message} 
      />
      
      <div className="flex items-center justify-between">
        <Link href="/forgot-password" className="text-sm font-semibold text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 hover:underline outline-none">
          Forgot your password?
        </Link>
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
};
