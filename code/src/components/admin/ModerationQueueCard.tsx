"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Bot,
  User,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate, timeAgo, getInitials } from "@/lib/utils";

export interface ModerationReportItem {
  id: string;
  postId: string;
  reporterId: string;
  reason: string;
  status: "PENDING" | "REVIEWED" | "DISMISSED" | "REMOVED";
  aiFlagged: boolean;
  aiReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  post: {
    id: string;
    content: string;
    imageUrl: string | null;
    isFlagged: boolean;
    flagReason: string | null;
    isHidden: boolean;
    createdAt: string;
    author: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      role: string;
    };
  };
}

interface ModerationQueueCardProps {
  report: ModerationReportItem;
  onResolve: (reportId: string, action: "APPROVE" | "DISMISS" | "REMOVE_POST") => Promise<void>;
}

export function ModerationQueueCard({ report, onResolve }: ModerationQueueCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isPending = report.status === "PENDING";

  const handleAction = async (action: "APPROVE" | "DISMISS" | "REMOVE_POST") => {
    setIsLoading(true);
    try {
      await onResolve(report.id, action);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-5 space-y-4 ${
        isPending
          ? "bg-white dark:bg-[#0E131F] border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
          : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-850 opacity-80"
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI vs Human Flag */}
          {report.aiFlagged ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
              <Bot className="w-3.5 h-3.5" />
              AI Agent Flagged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
              <User className="w-3.5 h-3.5" />
              Community Report
            </span>
          )}

          {/* Status Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              report.status === "PENDING"
                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                : report.status === "REMOVED"
                ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900"
                : report.status === "DISMISSED"
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {report.status}
          </span>

          {report.post?.isHidden && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <EyeOff className="w-3 h-3" /> Hidden from Feed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Reported {timeAgo(new Date(report.createdAt))}</span>
        </div>
      </div>

      {/* Flag Reason Box */}
      <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Report Reason:</span>
        </div>
        <p className="italic">{report.reason || report.aiReason || "Potential community guideline violation."}</p>
      </div>

      {/* Reported Post Content Preview */}
      <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        {/* Post Author Info */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
              {getInitials(report.post?.author?.name || "Author")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {report.post?.author?.name || "Unknown Author"}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {report.post?.author?.role || "STUDENT"}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">{report.post?.author?.email}</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            Posted {formatDate(new Date(report.post?.createdAt || report.createdAt))}
          </span>
        </div>

        {/* Content text */}
        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
          {report.post?.content || <span className="italic text-slate-400">(No text content)</span>}
        </p>

        {/* Media Preview if attached */}
        {report.post?.imageUrl && (
          <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-sm">
            <img
              src={report.post.imageUrl}
              alt="Reported media attachment"
              className="w-full max-h-56 object-cover"
            />
          </div>
        )}
      </div>

      {/* Reporter Details & Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-xs text-slate-400">
          Reported by:{" "}
          <strong className="text-slate-700 dark:text-slate-300 font-semibold">
            {report.reporter?.name || "Automated Safety Agent"}
          </strong>{" "}
          ({report.reporter?.email || "internal"})
        </div>

        {/* Resolution Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dismiss / Restore Post */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("DISMISS")}
            isLoading={isLoading}
            disabled={report.status === "DISMISSED"}
            className="text-xs h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>Dismiss (Keep Post)</span>
          </Button>

          {/* Confirm Removal */}
          <Button
            size="sm"
            onClick={() => handleAction("REMOVE_POST")}
            isLoading={isLoading}
            disabled={report.status === "REMOVED"}
            className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Remove Post</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

