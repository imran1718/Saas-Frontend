'use client';

import React from 'react';
import { CompanyProfileForm } from '../../../../components/company/CompanyProfileForm';
import { DocumentUploadCard } from '../../../../components/company/DocumentUploadCard';

export default function CompanySettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your business information and KYC documents.
        </p>
      </div>
      
      <CompanyProfileForm />
      <DocumentUploadCard />
    </div>
  );
}
