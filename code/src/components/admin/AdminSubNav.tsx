"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldAlert, Sliders, ArrowLeft, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSubNavProps {
  title?: string;
  description?: string;
  badgeCount?: number;
}

export function AdminSubNav({ title, description, badgeCount }: AdminSubNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "User Directory", href: "/admin/users", icon: Users },
    {
      label: "Moderation Queue",
      href: "/admin/moderation",
      icon: ShieldAlert,
      badge: badgeCount,
    },
    { label: "Settings & Invites", href: "/admin/settings", icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 tracking-wider uppercase">
            <Shield className="w-4 h-4" />
            <span>Platform Administration</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading">
            {title || "Admin Control Panel"}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            {description ||
              "Manage platform users, inspect reported content, configure registration policies, and tune AI safety moderation."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Feed</span>
          </Link>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 overflow-x-auto pb-px scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-150 whitespace-nowrap",
                isActive
                  ? "border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 rounded-t-xl"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-rose-600 dark:text-rose-400" : "text-slate-400")} />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

