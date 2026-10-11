"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCheck,
  ArrowLeft,
  ExternalLink,
  Shield,
  GraduationCap,
  Sparkles,
  Maximize2,
  X,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { getInitials } from "@/lib/utils";
import { MessageInput } from "@/components/chat/MessageInput";

export interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: string | Date;
  sender?: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
  };
}

export interface PartnerProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio?: string | null;
  department?: string | null;
  batch?: string | null;
}

interface ChatBoxProps {
  partner: PartnerProfile;
  messages: MessageItem[];
  currentUserId: string;
  isPartnerTyping?: boolean;
  onSendMessage: (content: string, imageUrl?: string) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onBackToConversations?: () => void;
  isLoading?: boolean;
}

export function ChatBox({
  partner,
  messages,
  currentUserId,
  isPartnerTyping = false,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onBackToConversations,
  isLoading = false,
}: ChatBoxProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [partner.id]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, isPartnerTyping]);

  // Group messages with date dividers
  const renderDateDivider = (date: Date) => {
    let label = format(date, "MMMM d, yyyy");
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";

    return (
      <div className="flex items-center justify-center my-4">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-2xs">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#070A11] relative">
      {/* Chat Header */}
      <div className="px-4 py-3.5 bg-white dark:bg-[#0E131F] border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          {onBackToConversations && (
            <button
              onClick={onBackToConversations}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Partner Avatar */}
          <div className="relative">
            {partner.avatar ? (
              <img
                src={partner.avatar}
                alt={partner.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {getInitials(partner.name)}
              </div>
            )}
          </div>

          {/* Partner Details & Status */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {partner.name}
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {partner.role}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              {isPartnerTyping ? (
                <span className="text-rose-600 font-semibold animate-pulse flex items-center gap-1">
                  typing
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 bg-rose-600 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-rose-600 rounded-full animate-bounce delay-100" />
                    <span className="w-1 h-1 bg-rose-600 rounded-full animate-bounce delay-200" />
                  </span>
                </span>
              ) : partner.department ? (
                <span>
                  {partner.department}
                  {partner.batch ? ` • Batch ${partner.batch}` : ""}
                </span>
              ) : (
                <span className="text-slate-400">Campus Member</span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Link Button */}
        <Link
          href={`/profile/${partner.id}`}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="View profile"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Message Stream Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading message history...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center font-bold text-lg shadow-sm">
              💬
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">
              Start a conversation with {partner.name}
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Messages are verified and private to this institutional connection.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            const msgDate = new Date(msg.createdAt);
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null;
            const showDateDivider =
              !prevDate || !isToday(msgDate) && prevDate.toDateString() !== msgDate.toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && renderDateDivider(msgDate)}

                <div
                  className={`flex items-end gap-2 ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Partner mini avatar on left if received */}
                  {!isMe && (
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-1">
                      {partner.avatar ? (
                        <img
                          src={partner.avatar}
                          alt={partner.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
                          {getInitials(partner.name)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] sm:max-w-[65%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs space-y-1.5 ${
                      isMe
                        ? "bg-rose-600 text-white rounded-br-xs"
                        : "bg-white dark:bg-[#0E131F] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/80 rounded-bl-xs"
                    }`}
                  >
                    {/* Image Attachment */}
                    {msg.imageUrl && (
                      <div className="relative group cursor-pointer overflow-hidden rounded-xl">
                        <img
                          src={msg.imageUrl}
                          alt="Attachment"
                          onClick={() => setFullscreenImage(msg.imageUrl || null)}
                          className="max-h-60 w-auto rounded-xl object-cover hover:scale-[1.02] transition-transform"
                        />
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.content && (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}

                    {/* Time & Read Receipts */}
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] ${
                        isMe ? "text-rose-200" : "text-slate-400"
                      }`}
                    >
                      <span>{format(msgDate, "p")}</span>
                      {isMe && (
                        <span>
                          {msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-rose-200" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />

      {/* Lightbox / Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={fullscreenImage}
              alt="Fullscreen View"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-3 -right-3 p-1.5 rounded-full bg-white text-slate-900 shadow-xl hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
