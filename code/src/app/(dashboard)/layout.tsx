import React from "react";
import { TopNav } from "@/components/layout/TopNav";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 font-[family-name:var(--font-body)]">
      <TopNav />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
