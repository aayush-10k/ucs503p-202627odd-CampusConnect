"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  Ticket,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Loader2,
  Clock,
} from "lucide-react";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { Button } from "@/components/ui/Button";
import { timeAgo, getInitials } from "@/lib/utils";

interface StatsData {
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    suspendedUsers: number;
    verifiedUsers: number;
    totalGroups: number;
    totalPosts: number;
    flaggedPosts: number;
    pendingReports: number;
    activeInvites: number;
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "TEACHER" | "ADMIN";
    isVerified: boolean;
    isSuspended: boolean;
    createdAt: string;
  }>;
  recentReports: Array<{
    id: string;
    reason: string;
    aiFlagged: boolean;
    createdAt: string;
    reporter: {
      id: string;
      name: string;
      email: string;
    };
    post: {
      id: string;
      content: string;
      author: {
        name: string;
      };
    };
  }>;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access Denied: Admin privileges required.");
        }
        throw new Error("Failed to load platform statistics.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const stats = data?.stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <AdminSubNav
        title="Admin Control Overview"
        description="Live institutional activity, registration health, and community safety status."
        badgeCount={stats?.pendingReports}
      />

      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Platform Health</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time aggregate counts synced from PostgreSQL database
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-rose-600" : ""}`} />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          <p className="text-sm font-medium text-slate-500">Loading system metrics...</p>
        </div>
      ) : stats ? (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Users */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {stats.totalUsers}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.totalStudents} Students</span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.totalTeachers} Faculty</span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.totalAdmins} Admin</span>
              </div>
            </div>

            {/* Moderation Queue */}
            <Link
              href="/admin/moderation"
              className="p-5 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-rose-400 dark:hover:border-rose-800 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Moderation Queue</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span>{stats.pendingReports}</span>
                {stats.pendingReports > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Needs Action
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-rose-600 transition-colors">
                <span>{stats.flaggedPosts} flagged community posts</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </p>
            </Link>

            {/* Groups & Collaboration */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Hubs</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {stats.totalGroups}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subjects, Labs, Batches & Clubs active
              </p>
            </div>

            {/* Active Invites & Verification */}
            <Link
              href="/admin/settings"
              className="p-5 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-800 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Access & Invites</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {stats.activeInvites}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-emerald-600 transition-colors">
                <span>{stats.suspendedUsers} suspended account(s)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </p>
            </Link>
          </div>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/admin/users"
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/60 to-white dark:from-[#111928] dark:to-[#0B0F19] border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-600/20">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                User Management Directory
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Search student and faculty rosters, manage account suspensions, verify emails, and modify role permissions.
              </p>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                Open Directory <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/admin/moderation"
              className="p-6 rounded-2xl bg-gradient-to-br from-rose-50/60 to-white dark:from-[#1F1116] dark:to-[#0B0F19] border border-rose-100 dark:border-rose-900/30 hover:border-rose-300 dark:hover:border-rose-700/60 transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-4 shadow-md shadow-rose-600/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-rose-600 transition-colors">
                Moderation Review Queue
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Inspect AI-flagged violations and community reported posts. Confirm removals or dismiss false alarms.
              </p>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                Inspect Queue ({stats.pendingReports}) <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/admin/settings"
              className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white dark:from-[#0E1F1A] dark:to-[#0B0F19] border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-600/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors">
                Registration & AI Policies
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Set campus join policy (Open, Domain-Restricted, or Invite-Only) and adjust Gemini AI moderation sensitivity.
              </p>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                Configure Settings <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          {/* Bottom Grid: Recent Users & Recent Moderation Flags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Registrations */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Registrations</h3>
                  <p className="text-xs text-slate-400">Newly joined campus community members</p>
                </div>
                <Link
                  href="/admin/users"
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 inline-flex items-center gap-1"
                >
                  View All Users <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {data.recentUsers && data.recentUsers.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {data.recentUsers.map((u) => (
                    <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {u.name}
                            </span>
                            {u.isSuspended && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                                Suspended
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 truncate block">{u.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                              : u.role === "TEACHER"
                              ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {u.role}
                        </span>
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {timeAgo(new Date(u.createdAt))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">No recent registrations found.</div>
              )}
            </div>

            {/* Pending Moderation Alerts */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Moderation Alerts</h3>
                  <p className="text-xs text-slate-400">Unresolved flagged content awaiting review</p>
                </div>
                <Link
                  href="/admin/moderation"
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 inline-flex items-center gap-1"
                >
                  Open Queue <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {data.recentReports && data.recentReports.length > 0 ? (
                <div className="space-y-3">
                  {data.recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            report.aiFlagged
                              ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {report.aiFlagged ? "AI Agent Flagged" : "Community Reported"}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(new Date(report.createdAt))}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                        &ldquo;{report.post?.content || "Media attachment"}&rdquo;
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span>Author: {report.post?.author?.name || "Unknown"}</span>
                        <span>Reporter: {report.reporter?.name || "System"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mb-1" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Moderation Queue Clear</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    All flagged content and community reports have been successfully reviewed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

