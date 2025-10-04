// Admin page for Smart Categorization System
import React from 'react';
import { CategorizationAdminDashboard } from '@/components/admin/CategorizationAdminDashboard';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage the Smart Categorization System
        </p>
      </div>
      
      <CategorizationAdminDashboard />
    </div>
  );
}
