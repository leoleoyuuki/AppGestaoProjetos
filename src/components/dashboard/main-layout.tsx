"use client";

import { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import OverviewTab from '@/components/dashboard/overview-tab';
import ProjectsTab from '@/components/dashboard/projects-tab';
import CostsTab from '@/components/dashboard/costs-tab';
import RevenueTab from '@/components/dashboard/revenue-tab';
import CashflowTab from '@/components/dashboard/cashflow-tab';
import ReportsTab from '@/components/dashboard/reports-tab';

export default function MainLayout() {
  const [activeView, setActiveView] = useState('overview');

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'costs':
        return <CostsTab />;
      case 'revenue':
        return <RevenueTab />;
      case 'cashflow':
        return <CashflowTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <SidebarInset>
          <div className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
              {renderContent()}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
