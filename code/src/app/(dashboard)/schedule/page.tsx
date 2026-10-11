"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Clock,
  Filter,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CalendarView } from "@/components/schedule/CalendarView";
import { EventModal, EventItem } from "@/components/schedule/EventModal";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";

export default function SchedulePage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [activeDate, setActiveDate] = useState<Date | null>(null);

  // Fetch events
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "ALL") {
        params.append("type", selectedType);
      }
      if (selectedScope !== "ALL") {
        params.append("groupId", selectedScope);
      }

      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's joined groups for selector
  const fetchUserGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        const joined = (data.groups || [])
          .filter((g: { isMember?: boolean }) => g.isMember)
          .map((g: { id: string; name: string }) => ({ id: g.id, name: g.name }));
        setUserGroups(joined);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  };

  useEffect(() => {
    fetchUserGroups();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedType, selectedScope]);

  // Click handlers
  const handleSelectEvent = (event: EventItem) => {
    setActiveEvent(event);
    setActiveDate(null);
    setIsModalOpen(true);
  };

  const handleSelectDate = (date: Date) => {
    setActiveEvent(null);
    setActiveDate(date);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setActiveEvent(null);
    setActiveDate(new Date());
    setIsModalOpen(true);
  };

  // Calculate upcoming deadlines (next 7 days)
  const now = new Date();
  const upcomingEvents = events
    .filter((e) => {
      const d = new Date(e.startDate);
      const diff = differenceInDays(d, now);
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  // Stats
  const examCount = events.filter((e) => e.type === "EXAM").length;
  const assignmentCount = events.filter((e) => e.type === "ASSIGNMENT").length;
  const lectureCount = events.filter((e) => e.type === "LECTURE").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-500 to-indigo-600 text-white p-6 sm:p-8 shadow-xl shadow-rose-600/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Unified Academic Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)]">
              Schedule & Deadlines Board
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 max-w-xl leading-relaxed">
              Consolidate university lectures, assignment due dates, exam timetables, and personal milestones into one synchronized view.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleCreateNew}
            className="bg-white text-rose-600 hover:bg-rose-50 border-white font-bold gap-2 self-start sm:self-center shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Event</span>
          </Button>
        </div>

        {/* Ambient background blur elements */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-rose-400/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-xs">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Items" },
            { id: "EXAM", label: "Exams" },
            { id: "ASSIGNMENT", label: "Assignments" },
            { id: "LECTURE", label: "Lectures" },
            { id: "REMINDER", label: "Reminders" },
          ].map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scope Dropdown Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="ALL">All Calendars</option>
            <option value="personal">Personal Events Only</option>
            {userGroups.map((g) => (
              <option key={g.id} value={g.id}>
                Group: {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Calendar (Left 2/3) & Sidebar Widgets (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: The Main Calendar View */}
        <div className="lg:col-span-2 space-y-4">
          <CalendarView
            events={events}
            onSelectEvent={handleSelectEvent}
            onSelectDate={handleSelectDate}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Upcoming Deadlines & Stats */}
        <div className="space-y-5">
          {/* Upcoming Deadlines Widget */}
          <div className="bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                Upcoming Deadlines
              </h3>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Next 14 Days
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 italic">
                No immediate deadlines in the next 14 days.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((ev) => {
                  const evDate = new Date(ev.startDate);
                  const isDueToday = isToday(evDate);
                  const isDueTomorrow = isTomorrow(evDate);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => handleSelectEvent(ev)}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-1">
                          {ev.title}
                        </span>
                        {isDueToday ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500 text-white shrink-0 animate-pulse">
                            TODAY
                          </span>
                        ) : isDueTomorrow ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shrink-0">
                            TOMORROW
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {format(evDate, "MMM d")}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {format(evDate, "p")}
                        </span>
                        {ev.group && (
                          <span className="truncate max-w-[120px] font-medium text-slate-400">
                            {ev.group.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
              Schedule Overview
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30">
                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                  {examCount}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Exams</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30">
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {assignmentCount}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Tasks</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30">
                <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {lectureCount}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Lectures</div>
              </div>
            </div>
          </div>

          {/* Category Legend */}
          <div className="bg-slate-50 dark:bg-[#070A11] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 text-xs text-slate-500 space-y-2">
            <div className="font-bold text-slate-700 dark:text-slate-300">Category Key</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Exams & Quizzes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Assignments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Lectures</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Reminders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={activeEvent}
        initialDate={activeDate}
        userGroups={userGroups}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onEventSaved={fetchEvents}
        onEventDeleted={fetchEvents}
      />
    </div>
  );
}
