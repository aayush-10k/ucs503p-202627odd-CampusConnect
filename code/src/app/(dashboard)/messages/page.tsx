"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Shield,
  Users,
  Search,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  UserChatList,
  ConversationItem,
  FriendOption,
} from "@/components/chat/UserChatList";
import {
  ChatBox,
  MessageItem,
  PartnerProfile,
} from "@/components/chat/ChatBox";
import { getSocket } from "@/lib/socket";

function MessagesContent() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserName = session?.user?.name || "Me";
  const currentUserRole = session?.user?.role || "STUDENT";
  const currentUserAvatar = session?.user?.image;

  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get("userId");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<PartnerProfile | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Fetch friends for "New Chat" modal
  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  }, []);

  // Fetch messages for active partner
  const fetchMessagesForPartner = useCallback(
    async (partnerId: string) => {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages/${partnerId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setActivePartner(data.partner || null);

          // Update local conversation unread count to 0
          setConversations((prev) =>
            prev.map((c) =>
              c.partner.id === partnerId ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      } catch (err) {
        console.error("Failed to fetch messages for user:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchFriends();
  }, [fetchConversations, fetchFriends]);

  // Handle preselected partner from URL (e.g. ?userId=...)
  useEffect(() => {
    if (preselectedUserId && preselectedUserId !== activePartnerId) {
      setActivePartnerId(preselectedUserId);
      fetchMessagesForPartner(preselectedUserId);
    }
  }, [preselectedUserId, activePartnerId, fetchMessagesForPartner]);

  // Select a conversation
  const handleSelectConversation = (partnerId: string) => {
    setActivePartnerId(partnerId);
    setIsPartnerTyping(false);
    fetchMessagesForPartner(partnerId);

    // Join Socket.io 1-on-1 room
    if (currentUserId) {
      const socket = getSocket(currentUserId);
      socket?.emit("join:chat", { userA: currentUserId, userB: partnerId });
    }
  };

  // Socket.io real-time listeners
  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket(currentUserId);
    if (!socket) return;

    // Listen for incoming messages
    const handleNewMessage = (newMsg: MessageItem) => {
      // If message belongs to currently open conversation
      if (
        (newMsg.senderId === activePartnerId && newMsg.receiverId === currentUserId) ||
        (newMsg.senderId === currentUserId && newMsg.receiverId === activePartnerId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // If I am looking at this conversation, mark as read on server
        if (newMsg.senderId === activePartnerId) {
          fetch(`/api/messages/read/${activePartnerId}`, { method: "PATCH" });
        }
      }

      // Update conversations inbox list snippet
      setConversations((prev) => {
        const partnerId =
          newMsg.senderId === currentUserId ? newMsg.receiverId : newMsg.senderId;
        const existingIndex = prev.findIndex((c) => c.partner.id === partnerId);

        if (existingIndex !== -1) {
          const updated = [...prev];
          const current = updated[existingIndex];
          updated[existingIndex] = {
            ...current,
            lastMessage: {
              id: newMsg.id,
              content: newMsg.content,
              imageUrl: newMsg.imageUrl || null,
              createdAt: newMsg.createdAt,
              senderId: newMsg.senderId,
              isRead: newMsg.senderId === currentUserId || partnerId === activePartnerId,
            },
            unreadCount:
              newMsg.senderId !== currentUserId && partnerId !== activePartnerId
                ? current.unreadCount + 1
                : current.unreadCount,
          };
          // Move updated conversation to top
          const [item] = updated.splice(existingIndex, 1);
          return [item, ...updated];
        } else {
          // Re-fetch conversations if brand new partner
          fetchConversations();
          return prev;
        }
      });
    };

    // Typing presence listeners
    const handleTypingStart = (data: { senderId: string }) => {
      if (data.senderId === activePartnerId) {
        setIsPartnerTyping(true);
      }
    };

    const handleTypingStop = (data: { senderId: string }) => {
      if (data.senderId === activePartnerId) {
        setIsPartnerTyping(false);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [currentUserId, activePartnerId, fetchConversations]);

  // Send message handler
  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!activePartnerId || !currentUserId) return;

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: activePartnerId,
        content,
        imageUrl,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to send message");
    }

    const data = await res.json();
    const createdMsg = data.message;

    // Optimistically update message stream
    setMessages((prev) => [...prev, createdMsg]);

    // Dispatch real-time event via Socket.io
    const socket = getSocket(currentUserId);
    if (socket) {
      socket.emit("message:send", {
        ...createdMsg,
        sender: {
          id: currentUserId,
          name: currentUserName,
          role: currentUserRole,
          avatar: currentUserAvatar,
        },
      });
    }

    // Update conversations list order
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.partner.id === activePartnerId);
      if (idx !== -1) {
        const copy = [...prev];
        const [target] = copy.splice(idx, 1);
        target.lastMessage = {
          id: createdMsg.id,
          content: createdMsg.content,
          imageUrl: createdMsg.imageUrl,
          createdAt: createdMsg.createdAt,
          senderId: currentUserId,
          isRead: false,
        };
        return [target, ...copy];
      }
      return prev;
    });
  };

  // Typing status triggers
  const handleTypingStart = () => {
    if (!activePartnerId || !currentUserId) return;
    const socket = getSocket(currentUserId);
    socket?.emit("typing:start", {
      senderId: currentUserId,
      receiverId: activePartnerId,
      userName: currentUserName,
    });
  };

  const handleTypingStop = () => {
    if (!activePartnerId || !currentUserId) return;
    const socket = getSocket(currentUserId);
    socket?.emit("typing:stop", {
      senderId: currentUserId,
      receiverId: activePartnerId,
    });
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] md:h-[calc(100vh-5rem)] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-[#0E131F] shadow-sm flex flex-col md:flex-row">
      {/* Left Column: User Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 h-full flex flex-col ${
          activePartnerId ? "hidden md:flex" : "flex"
        }`}
      >
        <UserChatList
          conversations={conversations}
          activePartnerId={activePartnerId}
          currentUserId={currentUserId}
          friends={friends}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Right Column: Chat Box or Empty Splash */}
      <div
        className={`flex-1 h-full flex flex-col ${
          activePartnerId ? "flex" : "hidden md:flex"
        }`}
      >
        {activePartnerId && activePartner ? (
          <ChatBox
            partner={activePartner}
            messages={messages}
            currentUserId={currentUserId || ""}
            isPartnerTyping={isPartnerTyping}
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            onBackToConversations={() => setActivePartnerId(null)}
            isLoading={isLoadingMessages}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-[#070A11] space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shadow-md">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
                Direct Messaging Hub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose a conversation from the sidebar or click the new message icon to start a direct, verified conversation with a classmate or instructor.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>CampusConnect Verified Identity</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-6.5rem)] flex items-center justify-center text-xs text-slate-400">
          Loading messaging interface...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
