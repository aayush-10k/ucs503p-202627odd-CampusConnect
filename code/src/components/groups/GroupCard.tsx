"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, FileText, Lock, Globe, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface GroupCardData {
  id: string;
  name: string;
  description?: string | null;
  type: "SUBJECT" | "BATCH" | "LAB" | "CLUB";
  isOpen: boolean;
  createdAt: string | Date;
  currentUserRole?: "ADMIN" | "MEMBER" | null;
  isMember?: boolean;
  _count?: {
    members: number;
    materials?: number;
    posts?: number;
  };
}

interface GroupCardProps {
  group: GroupCardData;
  onJoin?: (groupId: string) => void;
}

export function GroupCard({ group, onJoin }: GroupCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(Boolean(group.isMember));

  const typeColorMap = {
    SUBJECT: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    BATCH: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    LAB: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    CLUB: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };

  const handleQuickJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsJoining(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/join`, {
        method: "POST",
      });
      if (res.ok) {
        setHasJoined(true);
        if (onJoin) onJoin(group.id);
      }
    } catch (err) {
      console.error("Failed to join group:", err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-rose-400/40 dark:hover:border-rose-500/40">
      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span
            className={`inline-flex items-center text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
              typeColorMap[group.type] || typeColorMap.SUBJECT
            }`}
          >
            {group.type}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {group.isOpen ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                <Globe className="w-3 h-3" />
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[11px] font-medium border border-slate-500/20">
                <Lock className="w-3 h-3" />
                Closed
              </span>
            )}

            {group.currentUserRole && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-semibold border border-purple-500/20">
                <Shield className="w-3 h-3" />
                {group.currentUserRole}
              </span>
            )}
          </div>
        </div>

        {/* Group Name & Description */}
        <Link href={`/groups/${group.id}`} className="block group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)] leading-snug">
            {group.name}
          </h3>
        </Link>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {group.description || "Dedicated academic space for collaboration, course materials, and discussions."}
        </p>
      </div>

      {/* Footer Stats & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        {/* Counts */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {group._count?.members || 1} {group._count?.members === 1 ? "member" : "members"}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {group._count?.materials || 0} {group._count?.materials === 1 ? "file" : "files"}
          </span>
        </div>

        {/* Action Button */}
        {hasJoined ? (
          <Link href={`/groups/${group.id}`}>
            <Button size="sm" variant="outline" className="gap-1.5 font-semibold text-xs h-8">
              Open
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        ) : group.isOpen ? (
          <Button
            size="sm"
            variant="primary"
            isLoading={isJoining}
            onClick={handleQuickJoin}
            className="text-xs h-8 font-semibold"
          >
            Join Group
          </Button>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 italic">
            Invite required
          </span>
        )}
      </div>
    </div>
  );
}
