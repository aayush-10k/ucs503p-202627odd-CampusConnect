"use client";

import React, { useState } from "react";
import {
  Search,
  MessageSquarePlus,
  X,
  Users,
  Check,
  CheckCheck,
  ImageIcon,
} from "lucide-react";
import { timeAgo, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface ConversationItem {
  partner: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    department?: string | null;
    batch?: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: string | Date;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export interface FriendOption {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  department?: string | null;
  batch?: string | null;
}

interface UserChatListProps {
  conversations: ConversationItem[];
  activePartnerId?: string | null;
  currentUserId?: string;
  friends: FriendOption[];
  onSelectConversation: (partnerId: string) => void;
  isLoading?: boolean;
}

export function UserChatList({
  conversations,
  activePartnerId,
  currentUserId,
  friends,
  onSelectConversation,
  isLoading = false,
}: UserChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.partner.name.toLowerCase().includes(q) ||
      c.partner.email.toLowerCase().includes(q) ||
      (c.partner.department && c.partner.department.toLowerCase().includes(q))
    );
  });

  const filteredFriends = friends.filter((f) => {
    const q = friendSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      (f.department && f.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0E131F] border-r border-slate-200/80 dark:border-slate-800/80">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
              Messages
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {conversations.length}
            </span>
          </div>

          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Start New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
        {isLoading && conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading messages...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No conversations found
            </div>
            <p className="text-[11px] text-slate-400">
              Connect with classmates or click the button above to start a conversation.
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activePartnerId === conv.partner.id;
            const isOwnLastMessage = conv.lastMessage.senderId === currentUserId;

            return (
              <div
                key={conv.partner.id}
                onClick={() => onSelectConversation(conv.partner.id)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                  isSelected
                    ? "bg-rose-50/70 dark:bg-rose-950/30 border-l-4 border-rose-600"
                    : "hover:bg-slate-50 dark:hover:bg-slate-850/60"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {conv.partner.avatar ? (
                    <img
                      src={conv.partner.avatar}
                      alt={conv.partner.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {getInitials(conv.partner.name)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {conv.partner.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {timeAgo(conv.lastMessage.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      {isOwnLastMessage && (
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">You: </span>
                      )}
                      {conv.lastMessage.imageUrl && !conv.lastMessage.content && (
                        <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                          <ImageIcon className="w-3 h-3" /> Image attachment
                        </span>
                      )}
                      <span className="truncate">{conv.lastMessage.content}</span>
                    </p>

                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* "New Chat" Selection Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
                Start a New Chat
              </h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Friend search */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search friends by name or department..."
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-850">
              {filteredFriends.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  No peers found. Add friends in the Friends hub to start direct messaging.
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => {
                      onSelectConversation(friend.id);
                      setIsNewChatModalOpen(false);
                    }}
                    className="p-3 flex items-center justify-between gap-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                          {getInitials(friend.name)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {friend.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {friend.department || friend.role}
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="text-xs">
                      Message
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
