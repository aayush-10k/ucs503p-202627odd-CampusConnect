"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Users,
  BookOpen,
  FolderArchive,
  Calendar,
  MessageSquare,
  User as UserIcon,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const navItems = [
    { label: "Community Feed", href: "/feed", icon: Home },
    { label: "Friends & Peers", href: "/friends", icon: Users },
    { label: "Academic Groups", href: "/groups", icon: BookOpen },
    { label: "Course Materials", href: "/materials", icon: FolderArchive },
    { label: "Schedule Board", href: "/schedule", icon: Calendar },
    { label: "Direct Messages", href: "/messages", icon: MessageSquare },
    ...(user?.id ? [{ label: "My Profile", href: `/profile/${user.id}`, icon: UserIcon }] : []),
    ...(user?.role === "ADMIN" ? [{ label: "Admin Control", href: "/admin", icon: ShieldAlert }] : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0B0F19] min-h-[calc(100vh-4rem)] p-4 justify-between">
      {/* Navigation Links */}
      <nav className="space-y-1.5">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800/60 hover:text-rose-600"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-rose-600")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Card & Sign Out */}
      {user && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {getInitials(user.name || "User")}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-rose-600 transition-colors">
                {user.name}
              </p>
              <p className="text-xs text-slate-400 capitalize truncate">
                {user.role?.toLowerCase()} {user.department ? `• ${user.department}` : ""}
              </p>
            </div>
          </Link>

          <div className="flex items-center justify-between px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Theme Mode</span>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-rose-200/50 dark:border-rose-900/30"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
