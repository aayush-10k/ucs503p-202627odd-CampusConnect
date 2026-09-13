"use client";

import React, { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { Loader2, MessageSquare } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";

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

interface PostData {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  };
  likeCount: number;
  hasLiked: boolean;
  commentCount: number;
  isFlagged?: boolean;
  flagReason?: string | null;
  isHidden?: boolean;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const { data: session } = useSession();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [relationship, setRelationship] = useState<
    "SELF" | "FRIENDS" | "PENDING_SENT" | "PENDING_RECEIVED" | "NOT_FRIENDS"
  >("NOT_FRIENDS");
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postTab, setPostTab] = useState<"ALL" | "PUBLISHED" | "FLAGGED">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const publishedPosts = posts.filter((p) => !p.isFlagged);
  const flaggedPosts = posts.filter((p) => p.isFlagged);
  const displayedPosts =
    postTab === "PUBLISHED"
      ? publishedPosts
      : postTab === "FLAGGED"
      ? flaggedPosts
      : posts;

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile(data.user);
      setRelationship(data.relationship);
      setPendingRequestId(data.pendingRequestId);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`/api/posts?authorId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProfile(), fetchUserPosts()]).finally(() => {
      setIsLoading(false);
    });
  }, [userId]);

  const handleSendRequest = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });
      if (res.ok) {
        setRelationship("PENDING_SENT");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/friends/request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      if (res.ok) {
        setRelationship("FRIENDS");
        setPendingRequestId(null);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!confirm("Are you sure you want to unfriend this user?")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/friends/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRelationship("NOT_FRIENDS");
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">User not found</h2>
        <p className="text-sm text-slate-500 mt-1">This campus account may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ProfileHeader
        user={profile}
        relationship={relationship}
        pendingRequestId={pendingRequestId}
        onEditProfile={() => setIsEditModalOpen(true)}
        onSendRequest={handleSendRequest}
        onAcceptRequest={handleAcceptRequest}
        onRemoveFriend={handleRemoveFriend}
        isActionLoading={isActionLoading}
      />

      {/* User Posts Timeline */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-600" />
            Activity & Posts ({posts.length})
          </h2>

          {relationship === "SELF" && flaggedPosts.length > 0 && (
            <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-sm self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPostTab("ALL")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  postTab === "ALL"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
                }`}
              >
                All ({posts.length})
              </button>
              <button
                type="button"
                onClick={() => setPostTab("PUBLISHED")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  postTab === "PUBLISHED"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
                }`}
              >
                Published ({publishedPosts.length})
              </button>
              <button
                type="button"
                onClick={() => setPostTab("FLAGGED")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  postTab === "FLAGGED"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-amber-600 dark:text-amber-400 hover:text-amber-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Under Review ({flaggedPosts.length})
              </button>
            </div>
          )}
        </div>

        {displayedPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/50">
            <p className="text-sm text-slate-500 font-medium">
              {postTab === "FLAGGED"
                ? "No posts currently under review."
                : "No posts shared yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={session?.user?.id}
                currentUserRole={session?.user?.role}
                onPostDeleted={() => {
                  fetchUserPosts();
                  fetchProfile();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={profile}
          onProfileUpdated={() => {
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}
