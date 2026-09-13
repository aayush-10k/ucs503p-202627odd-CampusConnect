"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Users,
  FileText,
  Lock,
  Globe,
  Plus,
  Shield,
  ArrowLeft,
  Calendar,
  Layers,
  MessageSquare,
  LogOut,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CreatePostBox } from "@/components/feed/CreatePostBox";
import { PostCard, PostItem } from "@/components/feed/PostCard";
import { GroupCardData } from "@/components/groups/GroupCard";

export default function GroupDetailsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [group, setGroup] = useState<
    (GroupCardData & {
      members?: Array<{
        id: string;
        role: "ADMIN" | "MEMBER";
        user: { id: string; name: string; email: string; avatar: string | null; role: string };
      }>;
    }) | null
  >(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<
    Array<{ id: string; title: string; folder: string; fileType: string; createdAt: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group);
      }
    } catch (err) {
      console.error("Failed to fetch group:", err);
    }
  };

  const fetchGroupPosts = async () => {
    try {
      const res = await fetch(`/api/posts?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch group posts:", err);
    }
  };

  const fetchRecentMaterials = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/materials`);
      if (res.ok) {
        const data = await res.json();
        setRecentMaterials((data.materials || []).slice(0, 4));
      }
    } catch (err) {
      console.error("Failed to fetch recent materials:", err);
    }
  };

  useEffect(() => {
    Promise.all([fetchGroupDetails(), fetchGroupPosts(), fetchRecentMaterials()]).finally(() => {
      setIsLoading(false);
    });
  }, [groupId]);

  const handleJoinGroup = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        fetchGroupDetails();
      }
    } catch (err) {
      console.error("Failed to join group:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUserId) return;
    if (!confirm("Are you sure you want to leave this group?")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${currentUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchGroupDetails();
      }
    } catch (err) {
      console.error("Failed to leave group:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          <div className="h-72 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Academic group not found</h2>
        <p className="text-sm text-slate-500 mt-1">This group may have been archived or removed.</p>
        <Link href="/groups">
          <Button size="sm" variant="outline" className="mt-4">
            Back to Groups
          </Button>
        </Link>
      </div>
    );
  }

  const isMember = group.isMember;
  const isGroupAdmin = group.currentUserRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to All Groups
      </Link>

      {/* Group Hero Header */}
      <div className="rounded-3xl border border-rose-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {group.type}
              </span>
              {group.isOpen ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <Globe className="w-3.5 h-3.5" />
                  Open Group
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-500/20">
                  <Lock className="w-3.5 h-3.5" />
                  Invite Only
                </span>
              )}
              {isGroupAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-500/20">
                  <Shield className="w-3.5 h-3.5" />
                  Group Administrator
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
              {group.name}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {group.description || "Official institutional group workspace for materials, assignments, and discussions."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start">
            {isMember ? (
              <Button
                variant="outline"
                size="sm"
                isLoading={isActionLoading}
                onClick={handleLeaveGroup}
                className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Group
              </Button>
            ) : group.isOpen ? (
              <Button
                variant="primary"
                size="sm"
                isLoading={isActionLoading}
                onClick={handleJoinGroup}
                className="gap-1.5 text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Join Group
              </Button>
            ) : null}
          </div>
        </div>

        {/* Group Sub-navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <Link
            href={`/groups/${groupId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Group Feed
          </Link>

          <Link
            href={`/groups/${groupId}/materials`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Course Materials ({group._count?.materials || 0})
          </Link>

          <Link
            href={`/groups/${groupId}/members`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Users className="w-4 h-4" />
            Members ({group._count?.members || 1})
          </Link>
        </div>
      </div>

      {/* Main Content Grid: Feed (Left) & Group Widgets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Group Feed */}
        <div className="lg:col-span-2 space-y-5">
          {isMember ? (
            <CreatePostBox
              groupId={groupId}
              placeholder={`Share an announcement, question, or link with ${group.name}...`}
              onPostCreated={fetchGroupPosts}
            />
          ) : (
            <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3">
              <span>Join this group to post messages and participate in discussions.</span>
              {group.isOpen && (
                <Button size="sm" variant="primary" onClick={handleJoinGroup} isLoading={isActionLoading}>
                  Join Now
                </Button>
              )}
            </div>
          )}

          {/* Posts Stream */}
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onPostDeleted={fetchGroupPosts} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-6">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No posts in this group yet</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Be the first to start a discussion or post an announcement!
              </p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Group Meta & Materials Widget */}
        <div className="space-y-5">
          {/* Quick Materials Widget */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                Course Materials
              </h3>
              <Link
                href={`/groups/${groupId}/materials`}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                View All
              </Link>
            </div>

            {recentMaterials.length > 0 ? (
              <div className="space-y-2">
                {recentMaterials.map((mat) => (
                  <Link
                    key={mat.id}
                    href={`/groups/${groupId}/materials`}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {mat.title}
                      </p>
                      <span className="text-[10px] text-slate-400">{mat.folder}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                      {mat.fileType}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No materials uploaded yet.
                <div className="mt-2">
                  <Link href={`/groups/${groupId}/materials`}>
                    <Button size="sm" variant="outline" className="text-xs h-7 font-semibold">
                      Upload Files
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Group Leaders & Members preview */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Group Directory
              </h3>
              <Link
                href={`/groups/${groupId}/members`}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-2.5">
              {(group.members || []).slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                      {m.user.name?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {m.user.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{m.user.role}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.role === "ADMIN"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
