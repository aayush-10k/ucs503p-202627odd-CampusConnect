"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  BookOpen,
  Lock,
  Loader2,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from "date-fns";
import { EventItem } from "@/components/schedule/EventModal";
import { EventType } from "@prisma/client";

interface CalendarViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onSelectDate: (date: Date) => void;
  isLoading?: boolean;
}

type ViewMode = "month" | "week" | "agenda";

const EVENT_TYPE_BADGES: Record<
  EventType,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  LECTURE: {
    label: "Lecture",
    bg: "bg-blue-500/10 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
  },
  EXAM: {
    label: "Exam",
    bg: "bg-rose-500/10 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
  },
  ASSIGNMENT: {
    label: "Assignment",
    bg: "bg-amber-500/10 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  REMINDER: {
    label: "Reminder",
    bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  OTHER: {
    label: "Other",
    bg: "bg-purple-500/10 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
  },
};

export function CalendarView({
  events,
  onSelectEvent,
  onSelectDate,
  isLoading = false,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to find events on a given day
  const getEventsForDay = (date: Date) => {
    return events.filter((ev) => {
      const eventStart = new Date(ev.startDate);
      return isSameDay(eventStart, date);
    });
  };

  // Month grid dates
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Week strip dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Agenda items: sorted ascending
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <div className="bg-white dark:bg-[#0E131F] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Header / Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation & Month Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)] flex items-center gap-2">
            <span>
              {viewMode === "week"
                ? `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
                : format(currentDate, "MMMM yyyy")}
            </span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-rose-500" />}
          </h2>
        </div>

        {/* View Switcher Tabs (Month / Week / Agenda) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "month"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "week"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "agenda"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* VIEW: Month View */}
      {viewMode === "month" && (
        <div className="flex-1 flex flex-col">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-center py-2.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
              <span
                key={dayName}
                className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80 min-h-[500px]">
            {monthDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onSelectDate(day)}
                  className={`group relative p-2 min-h-[90px] sm:min-h-[110px] transition-colors cursor-pointer flex flex-col justify-between ${
                    isCurrentMonth
                      ? "bg-white dark:bg-[#0E131F] hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      : "bg-slate-50/40 dark:bg-slate-950/40 text-slate-300 dark:text-slate-600"
                  }`}
                >
                  {/* Day Number & Quick Add Button */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        isDayToday
                          ? "bg-rose-600 text-white"
                          : isCurrentMonth
                          ? "text-slate-700 dark:text-slate-200"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(day);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                      title="Add event on this date"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Events Stack */}
                  <div className="mt-1.5 space-y-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const badge = EVENT_TYPE_BADGES[ev.type];
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(ev);
                          }}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold border truncate cursor-pointer transition-transform hover:scale-[1.02] ${badge.bg} ${badge.text} ${badge.border}`}
                          title={`${ev.title} (${format(new Date(ev.startDate), "p")})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[10px] font-bold text-slate-400 pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: Week View */}
      {viewMode === "week" && (
        <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`p-3 rounded-2xl border transition-colors flex flex-col min-h-[350px] ${
                  isDayToday
                    ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
                }`}
              >
                {/* Week Day Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`text-base font-extrabold ${
                        isDayToday ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-white"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectDate(day)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Add Event"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Day Event Cards */}
                <div className="mt-3 space-y-2 flex-1 overflow-y-auto">
                  {dayEvents.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic pt-2 text-center">No events</div>
                  ) : (
                    dayEvents.map((ev) => {
                      const badge = EVENT_TYPE_BADGES[ev.type];
                      return (
                        <div
                          key={ev.id}
                          onClick={() => onSelectEvent(ev)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:shadow-xs transition-all space-y-1.5 ${badge.bg} ${badge.border}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${badge.text}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {format(new Date(ev.startDate), "p")}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                            {ev.title}
                          </div>
                          {ev.group && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span className="truncate">{ev.group.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: Agenda View */}
      {viewMode === "agenda" && (
        <div className="flex-1 p-5 divide-y divide-slate-100 dark:divide-slate-800/80">
          {sortedEvents.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No events currently scheduled
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Keep your academic calendar organized. Click &quot;Add Event&quot; to schedule assignment deadlines, lectures, or study sessions.
              </p>
            </div>
          ) : (
            sortedEvents.map((ev) => {
              const start = new Date(ev.startDate);
              const badge = EVENT_TYPE_BADGES[ev.type];

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 px-3 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {format(start, "MMM")}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {format(start, "d")}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        {ev.isPrivate && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                        {ev.title}
                      </h3>
                      {ev.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Time & Group Pill */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-xs text-slate-500 shrink-0 gap-1 pl-15 sm:pl-0">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{format(start, "p")}</span>
                      {ev.endDate && <span> – {format(new Date(ev.endDate), "p")}</span>}
                    </div>
                    {ev.group && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="max-w-[140px] truncate">{ev.group.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
