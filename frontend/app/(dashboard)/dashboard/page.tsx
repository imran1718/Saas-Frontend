'use client';

import React from 'react';
import { useAuth } from '@/lib/authStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Welcome, {user.name}!</h2>
          <p className="text-gray-600">You are logged in to the dashboard.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role.name}</p>
              <p><strong>Tenant ID:</strong> {user.tenant_id}</p>
            </div>
            
            <div className="pt-4 border-t">
              <Button onClick={() => logout()} variant="outline" className="w-full sm:w-auto">
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
