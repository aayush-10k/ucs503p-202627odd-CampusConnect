"use client";

import React, { useState, useRef } from "react";
import {
  Send,
  Image as ImageIcon,
  X,
  Loader2,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MessageInputProps {
  onSendMessage: (content: string, imageUrl?: string) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    // Typing debounce
    if (onTypingStart) {
      onTypingStart();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (onTypingStop) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
      }, 2000);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "campusconnect/chat");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image attachment.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && !imageUrl) return;
    if (isSending || isUploading) return;

    if (onTypingStop) {
      onTypingStop();
    }

    setIsSending(true);
    try {
      await onSendMessage(content.trim(), imageUrl || undefined);
      setContent("");
      setImageUrl(null);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-[#0E131F] border-t border-slate-100 dark:border-slate-800">
      {/* Uploaded image preview */}
      {imageUrl && (
        <div className="mb-2 relative inline-block">
          <img
            src={imageUrl}
            alt="Upload Preview"
            className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
          />
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition-colors shadow-md"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading}
        />

        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Attach image"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
        </button>

        {/* Text input */}
        <input
          type="text"
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Messaging is unavailable" : "Type a message..."}
          disabled={disabled || isSending}
          className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
        />

        {/* Send button */}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled || (!content.trim() && !imageUrl) || isSending}
          isLoading={isSending}
          className="px-3.5 py-2.5 shrink-0 rounded-xl"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
