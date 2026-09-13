"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Image as ImageIcon, Send, X, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";

interface CreatePostBoxProps {
  onPostCreated: () => void;
}

export function CreatePostBox({ onPostCreated }: CreatePostBoxProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    setIsSubmitting(true);
    setError(null);
    setAiWarning(null);

    try {
      let imageUrl: string | undefined = undefined;

      // Upload image to Cloudinary if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("folder", "campusconnect/posts");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Failed to upload image");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // Create post
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl,
        }),
      });

      const postData = await postRes.json();

      if (!postRes.ok) {
        throw new Error(postData.error || "Failed to create post");
      }

      if (postData.flagged) {
        setAiWarning(postData.warning || "Your post was automatically flagged by Gemini AI safety rules and hidden pending admin review.");
      } else {
        onPostCreated();
      }

      // Reset form
      setContent("");
      removeImage();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-rose-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3">
        {/* User avatar */}
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-rose-500/10 shadow-sm shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {getInitials(user?.name || "User")}
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-3">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an announcement, project update, or ask a question to campus peers..."
            maxLength={1000}
            className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none"
          />

          {/* Image Preview Thumbnail */}
          {imagePreview && (
            <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm max-w-xs">
              <img
                src={imagePreview}
                alt="Selected preview"
                className="h-32 w-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* AI Moderation Warning Banner */}
          {aiWarning && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>{aiWarning}</p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="post-image-input"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <label
                htmlFor="post-image-input"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 cursor-pointer transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-rose-500" />
                Add Image
              </label>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Gemini AI Protected
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                {content.length}/1000
              </span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={(!content.trim() && !selectedFile) || isSubmitting}
                isLoading={isSubmitting}
                className="gap-1.5 rounded-xl text-xs px-4 h-9"
              >
                <Send className="w-3.5 h-3.5" /> Publish
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
