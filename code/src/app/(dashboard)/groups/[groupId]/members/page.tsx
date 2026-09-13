"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users,
  ArrowLeft,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Check,
  X,
  MessageSquare,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GroupMemberData {
  id: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    department: string | null;
    batch: string | null;
  };
}

export default function GroupMembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isPlatformAdmin = session?.user?.role === "ADMIN";

  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<GroupMemberData[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<"ADMIN" | "MEMBER" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroupName(data.group.name);
        setMembers(data.group.members || []);
        setCurrentUserRole(data.group.currentUserRole);
      }
    } catch (err) {
      console.error("Failed to fetch group members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const isGroupAdmin = currentUserRole === "ADMIN" || isPlatformAdmin;

  const handleRoleChange = async (targetUserId: string, newRole: "ADMIN" | "MEMBER") => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${targetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error("Failed to change role:", err);
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this group?`)) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${targetUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      const isEmail = inviteIdentifier.includes("@");
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEmail ? { email: inviteIdentifier.trim() } : { userId: inviteIdentifier.trim() }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite member.");
      }

      setInviteIdentifier("");
      setIsInviteModalOpen(false);
      fetchMembers();
    } catch (err: unknown) {
      console.error(err);
      setInviteError(err instanceof Error ? err.message : "Failed to invite member.");
    } finally {
      setIsInviting(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {groupName || "Group"}
      </Link>

      {/* Header with Sub-tabs */}
      <div className="rounded-3xl border border-rose-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
              {groupName} — Members
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              View registered students, teachers, and assign administrator privileges.
            </p>
          </div>

          {isGroupAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="gap-2 shrink-0 self-start sm:self-center"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          )}
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <Link
            href={`/groups/${groupId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Group Feed
          </Link>

          <Link
            href={`/groups/${groupId}/materials`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Course Materials
          </Link>

          <Link
            href={`/groups/${groupId}/members`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
          >
            <Users className="w-4 h-4" />
            Members ({members.length})
          </Link>
        </div>
      </div>

      {/* Search and Member Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}
          </span>
        </div>

        {/* Member cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => {
            const isSelf = m.user.id === currentUserId;
            return (
              <div
                key={m.id}
                className="flex flex-col justify-between p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                        {m.user.name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {m.user.name} {isSelf && "(You)"}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                        m.role === "ADMIN"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mt-2">
                    {m.user.department && (
                      <p>
                        <span className="text-slate-400">Dept:</span> {m.user.department}
                      </p>
                    )}
                    {m.user.batch && (
                      <p>
                        <span className="text-slate-400">Batch:</span> {m.user.batch}
                      </p>
                    )}
                  </div>
                </div>

                {/* Admin Management Controls */}
                {isGroupAdmin && !isSelf && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {m.role === "MEMBER" ? (
                      <button
                        type="button"
                        onClick={() => handleRoleChange(m.user.id, "ADMIN")}
                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        Make Admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRoleChange(m.user.id, "MEMBER")}
                        className="text-xs font-semibold text-slate-500 hover:underline flex items-center gap-1"
                      >
                        Demote to Member
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B0F19] p-6 shadow-2xl">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              type="button"
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
              Invite Peer to Group
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter the student or faculty email address to grant immediate membership.
            </p>

            {inviteError && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Institutional Email / User ID
                </label>
                <input
                  type="text"
                  required
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  placeholder="e.g. alex@campus.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isInviting}>
                  Add Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
