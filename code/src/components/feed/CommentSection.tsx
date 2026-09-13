"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInitials, timeAgo } from "@/lib/utils";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  initialCount: number;
}

export function CommentSection({ postId, initialCount }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.comments) setComments(data.comments);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
      {/* Existing Comments */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-2">
          No comments yet. Start the conversation!
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5 text-xs">
              <Link href={`/profile/${c.author.id}`} className="shrink-0">
                {c.author.avatar ? (
                  <img
                    src={c.author.avatar}
                    alt={c.author.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-rose-500/10"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-blue-500 flex items-center justify-center text-white font-bold text-[10px]">
                    {getInitials(c.author.name)}
                  </div>
                )}
              </Link>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl px-3.5 py-2">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/profile/${c.author.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-rose-600 transition-colors"
                    >
                      {c.author.name}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-medium capitalize">
                      • {c.author.role.toLowerCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* New Comment Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={300}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!newComment.trim() || isSubmitting}
          isLoading={isSubmitting}
          className="h-8 px-3 rounded-xl gap-1 text-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}
