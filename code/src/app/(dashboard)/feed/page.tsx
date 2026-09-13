"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CreatePostBox } from "@/components/feed/CreatePostBox";
import { PostCard, PostItem } from "@/components/feed/PostCard";
import {
  Sparkles,
  Loader2,
  Users,
  ShieldCheck,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface PeerSuggestion {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  department: string | null;
  batch: string | null;
  reason?: string;
}

export default function FeedPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [suggestions, setSuggestions] = useState<PeerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectLoadingId, setConnectLoadingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts?limit=30");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/friends/suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestions((data.suggestions || []).slice(0, 4));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFeedData = () => {
    setIsLoading(true);
    Promise.all([fetchPosts(), fetchSuggestions()]).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadFeedData();
  }, []);

  const handleQuickConnect = async (peerId: string) => {
    setConnectLoadingId(peerId);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: peerId }),
      });
      if (res.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== peerId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConnectLoadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-8">
      {/* Center Main Feed Column */}
      <div className="flex-1 w-full max-w-2xl mx-auto space-y-6">
        {/* Post Creation Box */}
        <CreatePostBox onPostCreated={() => fetchPosts()} />

        {/* Feed Posts Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-[family-name:var(--font-heading)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              Campus Activity Feed
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Real-time updates
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
              <p className="text-xs text-slate-400">Loading campus posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white/60 dark:bg-slate-900/60 space-y-3">
              <Sparkles className="w-10 h-10 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                No posts on the feed yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first to share an academic question, campus announcement, or project update!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onPostDeleted={() => fetchPosts()}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar Widget (Desktop Only) */}
      <aside className="hidden lg:block w-80 shrink-0 space-y-6 sticky top-20">
        {/* Peer Suggestions Widget */}
        <div className="rounded-3xl border border-rose-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-600" />
              Peers to Connect
            </h3>
            <Link
              href="/friends"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              See all
            </Link>
          </div>

          {suggestions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No new suggestions.</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((peer) => (
                <div key={peer.id} className="flex items-center justify-between gap-3">
                  <Link href={`/profile/${peer.id}`} className="flex items-center gap-2.5 min-w-0 group">
                    {peer.avatar ? (
                      <img
                        src={peer.avatar}
                        alt={peer.name}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-rose-500/10 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {getInitials(peer.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-rose-600 transition-colors">
                        {peer.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {peer.department || peer.reason || "Student"}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleQuickConnect(peer.id)}
                    disabled={connectLoadingId === peer.id}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                    title="Send Friend Request"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Safety & Community Guidelines Card */}
        <div className="rounded-3xl border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            AI Guarded Campus
          </div>
          <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
            All posts and comments are actively analyzed by our Gemini AI content safety pipeline to ensure respectful, civil, and harassment-free academic collaboration.
          </p>
        </div>
      </aside>
    </div>
  );
}
