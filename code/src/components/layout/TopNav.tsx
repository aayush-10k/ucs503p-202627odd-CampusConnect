"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Sparkles } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

export function TopNav() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        {/* Brand & Mobile Title */}
        <div className="flex items-center gap-3">
          <Link href="/feed" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
              Campus<span className="text-rose-600">Connect</span>
            </span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search peers, courses, announcements..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme switcher */}
          <ThemeToggle />

          {/* Interactive Notifications */}
          <NotificationDropdown />

          {/* User Quick Pill */}
          {user && (
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-rose-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {getInitials(user.name || "User")}
                </div>
              )}
              <span className="hidden md:inline-block text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate">
                {user.name?.split(" ")[0]}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
