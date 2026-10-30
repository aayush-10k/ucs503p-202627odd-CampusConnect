"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { ModerationQueueCard, ModerationReportItem } from "@/components/admin/ModerationQueueCard";
import { Button } from "@/components/ui/Button";

interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ModerationReportItem[]>([]);
  const [pagination, setPagination] = useState<ReportPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchReports = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
      });

      if (sourceFilter === "AI") {
        params.set("aiFlagged", "true");
      } else if (sourceFilter === "USER") {
        params.set("aiFlagged", "false");
      }

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load moderation reports.");
      const data = await res.json();
      setReports(data.reports || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Error fetching reports", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [statusFilter, sourceFilter]);

  const handleResolve = async (reportId: string, action: "APPROVE" | "DISMISS" | "REMOVE_POST") => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resolve report");

      showToast(data.message || "Report updated successfully.");
      fetchReports(pagination.page);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error resolving report", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <AdminSubNav
        title="Moderation Review Queue"
        description="Inspect posts flagged by Gemini AI safety or reported by students and faculty. Confirm removals or dismiss safe content."
        badgeCount={statusFilter === "PENDING" ? pagination.total : undefined}
      />

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Status Toolbar */}
      <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { label: "Pending Review", value: "PENDING" },
            { label: "Removed", value: "REMOVED" },
            { label: "Dismissed", value: "DISMISSED" },
            { label: "All Reports", value: "ALL" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Source:</span>
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="ALL">All Sources</option>
            <option value="AI">AI Agent Only</option>
            <option value="USER">Community Reports Only</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
            <p className="text-sm font-medium text-slate-500">Loading moderation records...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No reports in this queue
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no moderation tickets matching the selected filter criteria.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <ModerationQueueCard
              key={report.id}
              report={report}
              onResolve={handleResolve}
            />
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {reports.length > 0 && (
        <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm flex items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{reports.length}</span> of{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{pagination.total}</span> reports
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReports(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReports(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="h-8 px-2.5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

