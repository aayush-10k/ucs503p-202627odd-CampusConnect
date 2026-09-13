"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, UserCheck, Clock, Search, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";

interface FriendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  department: string | null;
  batch: string | null;
  reason?: string;
}

interface IncomingRequest {
  id: string;
  sender: FriendUser;
  createdAt: string;
}

interface OutgoingRequest {
  id: string;
  receiver: FriendUser;
  createdAt: string;
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "suggestions">("friends");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends/requests");
      if (res.ok) {
        const data = await res.json();
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
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
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllData = () => {
    setIsLoading(true);
    Promise.all([fetchFriends(), fetchRequests(), fetchSuggestions()]).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch(`/api/friends/request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      if (res.ok) {
        fetchFriends();
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch(`/api/friends/request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT" }),
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });
      if (res.ok) {
        fetchRequests();
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnfriend = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/friends/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchFriends();
        fetchSuggestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.department && f.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
            Friends & Campus Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect with classmates, batchmates, and verified campus peers.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "friends"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
            }`}
          >
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "requests"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
            }`}
          >
            <Clock className="w-4 h-4" />
            Requests
            {incomingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("suggestions")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "suggestions"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Suggestions
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      ) : (
        <>
          {/* TAB 1: FRIENDS */}
          {activeTab === "friends" && (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter friends by name or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              {filteredFriends.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white/50 dark:bg-slate-900/50">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No friends connected yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Check the Suggestions tab to connect with peers from your batch or department!
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab("suggestions")}
                    className="mt-4 gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Explore Suggestions
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFriends.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-2xl border border-rose-100/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <Link href={`/profile/${f.id}`} className="shrink-0">
                          {f.avatar ? (
                            <img
                              src={f.avatar}
                              alt={f.name}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-500/10"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                              {getInitials(f.name)}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/profile/${f.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-white truncate block hover:text-rose-600 transition-colors"
                          >
                            {f.name}
                          </Link>
                          <p className="text-xs text-slate-400 truncate">
                            {f.department || "Student"} {f.batch ? `• Batch ${f.batch}` : ""}
                          </p>
                          <span className="inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {f.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/profile/${f.id}`}
                          className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                          View Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleUnfriend(f.id)}
                          disabled={actionLoadingId === f.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Unfriend"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === "requests" && (
            <div className="space-y-8">
              {/* Incoming */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Incoming Requests ({incomingRequests.length})
                </h3>

                {incomingRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No incoming friend requests.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {incomingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-2xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Link href={`/profile/${req.sender.id}`} className="shrink-0">
                            {req.sender.avatar ? (
                              <img
                                src={req.sender.avatar}
                                alt={req.sender.name}
                                className="w-10 h-10 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                {getInitials(req.sender.name)}
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/profile/${req.sender.id}`}
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block hover:text-rose-600"
                            >
                              {req.sender.name}
                            </Link>
                            <p className="text-[11px] text-slate-400 truncate">
                              {req.sender.department || "Campus peer"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptRequest(req.id)}
                            isLoading={actionLoadingId === req.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2.5 py-1 h-8"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Accept
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Sent Requests ({outgoingRequests.length})
                </h3>

                {outgoingRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No pending sent requests.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {outgoingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Link href={`/profile/${req.receiver.id}`} className="shrink-0">
                            {req.receiver.avatar ? (
                              <img
                                src={req.receiver.avatar}
                                alt={req.receiver.name}
                                className="w-10 h-10 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                                {getInitials(req.receiver.name)}
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/profile/${req.receiver.id}`}
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block hover:text-rose-600"
                            >
                              {req.receiver.name}
                            </Link>
                            <p className="text-[11px] text-slate-400 truncate">
                              {req.receiver.department || "Peer"}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SUGGESTIONS */}
          {activeTab === "suggestions" && (
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white/50 dark:bg-slate-900/50">
                  <Sparkles className="w-10 h-10 text-rose-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No new recommendations at this time
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    You are connected or have pending requests with all peers in your department/batch!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="rounded-2xl border border-rose-100/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <Link href={`/profile/${sug.id}`} className="shrink-0">
                          {sug.avatar ? (
                            <img
                              src={sug.avatar}
                              alt={sug.name}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-500/10"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                              {getInitials(sug.name)}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/profile/${sug.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-white truncate block hover:text-rose-600"
                          >
                            {sug.name}
                          </Link>
                          <p className="text-xs text-slate-400 truncate">
                            {sug.department || "Peer"} {sug.batch ? `• Batch ${sug.batch}` : ""}
                          </p>
                          {sug.reason && (
                            <span className="inline-block px-2 py-0.5 mt-1.5 rounded-md text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                              {sug.reason}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/profile/${sug.id}`}
                          className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                        >
                          Profile
                        </Link>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSendRequest(sug.id)}
                          isLoading={actionLoadingId === sug.id}
                          className="flex-1 text-xs py-1.5 h-8 gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Connect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
