"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Calendar as CalendarIcon,
  Plus,
  ArrowLeft,
  FileText,
  Users,
  MessageSquare,
  Shield,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CalendarView } from "@/components/schedule/CalendarView";
import { EventModal, EventItem } from "@/components/schedule/EventModal";
import { GroupCardData } from "@/components/groups/GroupCard";

export default function GroupSchedulePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;

  const [group, setGroup] = useState<GroupCardData | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [activeDate, setActiveDate] = useState<Date | null>(null);

  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group);
      }
    } catch (err) {
      console.error("Failed to fetch group:", err);
    }
  };

  const fetchGroupEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch group events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchGroupDetails(), fetchGroupEvents()]).finally(() => {
      setIsLoading(false);
    });
  }, [groupId]);

  const isGroupAdmin = group?.currentUserRole === "ADMIN";
  const canSchedule =
    isGroupAdmin || currentUserRole === "TEACHER" || currentUserRole === "ADMIN";

  const handleSelectEvent = (event: EventItem) => {
    setActiveEvent(event);
    setActiveDate(null);
    setIsModalOpen(true);
  };

  const handleSelectDate = (date: Date) => {
    if (!canSchedule) return;
    setActiveEvent(null);
    setActiveDate(date);
    setIsModalOpen(true);
  };

  const handleScheduleNew = () => {
    setActiveEvent(null);
    setActiveDate(new Date());
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Group Workspace</span>
        </Link>
      </div>

      {/* Group Header Banner */}
      {group && (
        <div className="bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
                  {group.type}
                </span>
                {group.isOpen ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                    <Globe className="w-3.5 h-3.5" />
                    Open Group
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-500/20">
                    <Lock className="w-3.5 h-3.5" />
                    Invite Only
                  </span>
                )}
                {isGroupAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-500/20">
                    <Shield className="w-3.5 h-3.5" />
                    Group Administrator
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
                {group.name} — Schedule & Deadlines
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Official calendar and timetable for {group.name} assignments, lab sessions, and exams.
              </p>
            </div>

            {canSchedule && (
              <Button
                variant="primary"
                onClick={handleScheduleNew}
                className="gap-2 text-xs shrink-0 self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                Schedule Group Event
              </Button>
            )}
          </div>

          {/* Group Tabs Subnavigation */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
            <Link
              href={`/groups/${groupId}`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Group Feed
            </Link>

            <Link
              href={`/groups/${groupId}/materials`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Course Materials ({group._count?.materials || 0})
            </Link>

            <Link
              href={`/groups/${groupId}/schedule`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
            >
              <CalendarIcon className="w-4 h-4" />
              Schedule ({events.length})
            </Link>

            <Link
              href={`/groups/${groupId}/members`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Users className="w-4 h-4" />
              Members ({group._count?.members || 1})
            </Link>
          </div>
        </div>
      )}

      {/* Main Group Calendar View */}
      <CalendarView
        events={events}
        onSelectEvent={handleSelectEvent}
        onSelectDate={handleSelectDate}
        isLoading={isLoading}
      />

      {/* Event Modal for Group Event Creation/Edit */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={activeEvent}
        initialDate={activeDate}
        groupId={groupId}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onEventSaved={fetchGroupEvents}
        onEventDeleted={fetchGroupEvents}
      />
    </div>
  );
}
