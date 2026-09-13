"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Share2,
} from "lucide-react";
import { getInitials, timeAgo } from "@/lib/utils";
import { CommentSection } from "@/components/feed/CommentSection";

interface PostAuthor {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  department?: string | null;
  batch?: string | null;
}

export interface PostItem {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  hasLiked: boolean;
  commentCount: number;
  isFlagged?: boolean;
  flagReason?: string | null;
  isHidden?: boolean;
}

interface PostCardProps {
  post: PostItem;
  currentUserId?: string;
  currentUserRole?: string;
  onPostDeleted?: () => void;
}

export function PostCard({
  post,
  currentUserId,
  currentUserRole,
  onPostDeleted,
}: PostCardProps) {
  const [likes, setLikes] = useState(post.likeCount);
  const [hasLiked, setHasLiked] = useState(post.hasLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete =
    currentUserId === post.author.id || currentUserRole === "ADMIN";

  const handleLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic update
    const nextHasLiked = !hasLiked;
    const nextLikes = nextHasLiked ? likes + 1 : Math.max(0, likes - 1);
    setHasLiked(nextHasLiked);
    setLikes(nextLikes);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setHasLiked(data.liked);
        setLikes(data.likeCount);
      } else {
        // Rollback on error
        setHasLiked(!nextHasLiked);
        setLikes(likes);
      }
    } catch (err) {
      console.error(err);
      setHasLiked(!nextHasLiked);
      setLikes(likes);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });
      if (res.ok && onPostDeleted) {
        onPostDeleted();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt("Why are you reporting this post?");
    if (!reason || reason.trim().length === 0) return;

    try {
      const res = await fetch(`/api/posts/${post.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        alert("Report submitted to administrators for review.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMenuOpen(false);
    }
  };

  const roleStyles = {
    ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    TEACHER: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    STUDENT: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  }[post.author.role] || "bg-slate-100 text-slate-700";

  return (
    <article className="rounded-3xl border border-rose-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
      {/* Moderation Status Banner (Visible to Author & Admin) */}
      {post.isFlagged && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Under Consideration
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
              Pending Admin Review
            </span>
          </div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            <span className="font-bold">Flagged Reason: </span>
            {post.flagReason || "Flagged by AI safety rules"}
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
            This post is currently hidden from the public feed. An administrator will review and either approve or remove it.
          </p>
        </div>
      )}

      {/* Post Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/profile/${post.author.id}`} className="shrink-0">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-rose-500/10 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                {getInitials(post.author.name)}
              </div>
            )}
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.id}`}
                className="font-bold text-sm text-slate-900 dark:text-white truncate hover:text-rose-600 transition-colors"
              >
                {post.author.name}
              </Link>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${roleStyles}`}>
                {post.author.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {post.author.department ? `${post.author.department} • ` : ""}
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Options dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-30 w-40 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl shadow-black/10 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={handleReport}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Report Post
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {/* Media Attachment */}
      {post.imageUrl && (
        <div className="mt-3.5 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="w-full max-h-96 object-cover hover:scale-[1.01] transition-transform duration-200"
          />
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              hasLiked
                ? "text-rose-600 bg-rose-50 dark:bg-rose-950/30"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                hasLiked ? "fill-rose-600 stroke-rose-600 scale-110" : ""
              }`}
            />
            <span>{likes}</span>
          </button>

          {/* Comment Toggle */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.commentCount}</span>
          </button>
        </div>

        {/* Share stub */}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Post link copied to clipboard!");
          }}
          className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          title="Share Link"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible Comment Drawer */}
      {showComments && (
        <CommentSection postId={post.id} initialCount={post.commentCount} />
      )}
    </article>
  );
}
