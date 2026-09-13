"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Plus, Search, Filter, Users, Sparkles, Loader2, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GroupCard, GroupCardData } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";

export default function GroupsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const canCreateGroup = user?.role === "TEACHER" || user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"MY_GROUPS" | "DISCOVER">("MY_GROUPS");
  const [joinedGroups, setJoinedGroups] = useState<GroupCardData[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<GroupCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchGroups = async (search?: string, type?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (type && type !== "ALL") params.append("type", type);

      const res = await fetch(`/api/groups?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJoinedGroups(data.joinedGroups || []);
        setDiscoverGroups(data.discoverGroups || []);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(searchQuery, selectedType);
  }, [searchQuery, selectedType]);

  const typeFilters = [
    { value: "ALL", label: "All Groups" },
    { value: "SUBJECT", label: "Subjects" },
    { value: "BATCH", label: "Batches" },
    { value: "LAB", label: "Labs" },
    { value: "CLUB", label: "Clubs" },
  ];

  const currentList = activeTab === "MY_GROUPS" ? joinedGroups : discoverGroups;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-blue-500/10 border border-rose-100/80 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 dark:bg-slate-900/80 text-rose-600 dark:text-rose-400 mb-2 border border-rose-200/50 dark:border-rose-900/40">
            <BookOpen className="w-3.5 h-3.5" />
            Academic Communities
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
            Academic Groups & Hubs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Join official batches, courses, and laboratories to access shared materials, collaborate on projects, and follow group feeds.
          </p>
        </div>

        {canCreateGroup && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 shadow-lg shadow-rose-600/20 shrink-0 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        )}
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Dual Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab("MY_GROUPS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "MY_GROUPS"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>My Groups ({joinedGroups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DISCOVER")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "DISCOVER"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discover & Explore ({discoverGroups.length})</span>
          </button>
        </div>

        {/* Search & Type filter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
            />
          </div>

          {/* Type dropdown or filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {typeFilters.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={() => setSelectedType(tf.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedType === tf.value
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Groups */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 animate-pulse p-6"
            />
          ))}
        </div>
      ) : currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentList.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onJoin={() => fetchGroups(searchQuery, selectedType)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === "MY_GROUPS" ? "No enrolled academic groups yet" : "No discoverable groups found"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === "MY_GROUPS"
              ? "Browse the Discover tab to find open courses, labs, and student societies, or create one if you are an educator."
              : "Try adjusting your search criteria or type filters to find active campus communities."}
          </p>
          {activeTab === "MY_GROUPS" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("DISCOVER")}
              className="mt-4 gap-2 font-semibold text-xs"
            >
              <Compass className="w-3.5 h-3.5" />
              Explore Open Groups
            </Button>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={() => fetchGroups(searchQuery, selectedType)}
      />
    </div>
  );
}
