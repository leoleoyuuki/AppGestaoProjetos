"use client";

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import MobileTabBar from '@/components/dashboard/mobile-tab-bar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background pb-24 md:pb-8">
              {children}
            </main>
          </div>
          <MobileTabBar />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
