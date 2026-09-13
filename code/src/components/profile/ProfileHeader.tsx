"use client";

import React from "react";
import { UserPlus, UserCheck, Clock, Edit3, Calendar, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInitials, formatDate } from "@/lib/utils";

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  department: string | null;
  batch: string | null;
  createdAt: string;
  postCount: number;
  publishedPostCount?: number;
  flaggedPostCount?: number;
  friendCount: number;
}

interface ProfileHeaderProps {
  user: UserProfileData;
  relationship: "SELF" | "FRIENDS" | "PENDING_SENT" | "PENDING_RECEIVED" | "NOT_FRIENDS";
  pendingRequestId?: string | null;
  onEditProfile: () => void;
  onSendRequest: () => Promise<void>;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onRemoveFriend: () => Promise<void>;
  isActionLoading?: boolean;
}

export function ProfileHeader({
  user,
  relationship,
  pendingRequestId,
  onEditProfile,
  onSendRequest,
  onAcceptRequest,
  onRemoveFriend,
  isActionLoading = false,
}: ProfileHeaderProps) {
  const roleBadgeStyles = {
    ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    TEACHER: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    STUDENT: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  }[user.role] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="relative rounded-3xl overflow-hidden border border-rose-100/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      {/* Cover Gradient Banner */}
      <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute right-6 bottom-4 text-white/20 hidden sm:flex items-center gap-1.5 font-bold text-sm">
          <Sparkles className="w-5 h-5" /> CampusConnect
        </div>
      </div>

      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
        {/* Avatar & Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4">
          <div className="relative group self-start">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl"
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-rose-600 to-blue-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-black ring-4 ring-white dark:ring-slate-900 shadow-xl">
                {getInitials(user.name)}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            {relationship === "SELF" && (
              <Button
                variant="outline"
                size="md"
                onClick={onEditProfile}
                className="gap-2 font-bold w-full sm:w-auto"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </Button>
            )}

            {relationship === "NOT_FRIENDS" && (
              <Button
                variant="primary"
                size="md"
                onClick={onSendRequest}
                isLoading={isActionLoading}
                className="gap-2 font-bold w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4" /> Add Friend
              </Button>
            )}

            {relationship === "PENDING_SENT" && (
              <Button
                variant="outline"
                size="md"
                disabled
                className="gap-2 font-bold opacity-80 w-full sm:w-auto text-slate-500"
              >
                <Clock className="w-4 h-4 text-amber-500" /> Request Sent
              </Button>
            )}

            {relationship === "PENDING_RECEIVED" && pendingRequestId && (
              <Button
                variant="primary"
                size="md"
                onClick={() => onAcceptRequest(pendingRequestId)}
                isLoading={isActionLoading}
                className="gap-2 font-bold w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
              >
                <UserCheck className="w-4 h-4" /> Accept Request
              </Button>
            )}

            {relationship === "FRIENDS" && (
              <Button
                variant="outline"
                size="md"
                onClick={onRemoveFriend}
                isLoading={isActionLoading}
                className="gap-2 font-bold text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 w-full sm:w-auto"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" /> Friends
              </Button>
            )}
          </div>
        </div>

        {/* User Identity Info */}
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
              {user.name}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${roleBadgeStyles}`}
            >
              {user.role}
            </span>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {user.email}
          </p>

          {/* Department & Batch Chips */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
            {user.department && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-rose-600" />
                {user.department}
              </span>
            )}
            {user.batch && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 font-medium">
                Batch {user.batch}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              Joined {formatDate(user.createdAt, "MMM yyyy")}
            </span>
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="text-slate-700 dark:text-slate-300 text-sm pt-2 leading-relaxed max-w-2xl whitespace-pre-wrap">
              {user.bio}
            </p>
          ) : (
            <p className="text-slate-400 text-sm italic pt-1">No bio added yet.</p>
          )}

          {/* Activity counters */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                {user.friendCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Friends</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                {user.publishedPostCount !== undefined ? user.publishedPostCount : user.postCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Published Posts</span>
            </div>
            {relationship === "SELF" && Boolean(user.flaggedPostCount && user.flaggedPostCount > 0) && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{user.flaggedPostCount} Under Review</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
