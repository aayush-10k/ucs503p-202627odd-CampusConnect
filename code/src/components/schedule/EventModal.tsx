"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EventType } from "@prisma/client";

export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  type: EventType;
  startDate: string;
  endDate?: string | null;
  isPrivate: boolean;
  groupId?: string | null;
  creatorId: string;
  creator?: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
  };
  group?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: EventItem | null; // If provided, view/edit mode; otherwise, create mode
  initialDate?: Date | null;
  groupId?: string | null; // If fixed to a group (e.g. from group page)
  userGroups?: Array<{ id: string; name: string }>;
  currentUserId?: string;
  currentUserRole?: string;
  onEventSaved: () => void;
  onEventDeleted?: () => void;
}

const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; badge: string }
> = {
  LECTURE: {
    label: "Lecture",
    color: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  EXAM: {
    label: "Exam",
    color: "bg-rose-500",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  ASSIGNMENT: {
    label: "Assignment Due",
    color: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  REMINDER: {
    label: "Reminder",
    color: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  OTHER: {
    label: "Other Event",
    color: "bg-purple-500",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
};

export function EventModal({
  isOpen,
  onClose,
  event,
  initialDate,
  groupId: fixedGroupId,
  userGroups = [],
  currentUserId,
  currentUserRole,
  onEventSaved,
  onEventDeleted,
}: EventModalProps) {
  const isEditing = Boolean(event);
  const canEditOrDelete =
    !event ||
    event.creatorId === currentUserId ||
    currentUserRole === "ADMIN" ||
    currentUserRole === "TEACHER";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventType>(EventType.OTHER);
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date to local datetime-local string (YYYY-MM-DDTHH:mm)
  const formatForDateTimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setType(event.type);
      setStartDateStr(formatForDateTimeLocal(new Date(event.startDate)));
      setEndDateStr(event.endDate ? formatForDateTimeLocal(new Date(event.endDate)) : "");
      setSelectedGroupId(event.groupId || "");
      setIsPrivate(event.isPrivate);
    } else {
      const baseDate = initialDate ? new Date(initialDate) : new Date();
      // Round to top of the next hour
      baseDate.setHours(baseDate.getHours() + 1, 0, 0, 0);
      const nextHour = new Date(baseDate.getTime() + 60 * 60 * 1000);

      setTitle("");
      setDescription("");
      setType(fixedGroupId ? EventType.LECTURE : EventType.REMINDER);
      setStartDateStr(formatForDateTimeLocal(baseDate));
      setEndDateStr(formatForDateTimeLocal(nextHour));
      setSelectedGroupId(fixedGroupId || "");
      setIsPrivate(false);
    }
  }, [isOpen, event, initialDate, fixedGroupId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide an event title");
      return;
    }
    if (!startDateStr) {
      setError("Please specify a start date and time");
      return;
    }

    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : null;

    if (isNaN(start.getTime())) {
      setError("Invalid start date");
      return;
    }
    if (end && isNaN(end.getTime())) {
      setError("Invalid end date");
      return;
    }
    if (end && end < start) {
      setError("End time cannot be earlier than start time");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        startDate: start.toISOString(),
        endDate: end ? end.toISOString() : null,
        isPrivate: selectedGroupId ? false : isPrivate,
        groupId: selectedGroupId || null,
      };

      let res: Response;
      if (isEditing && event) {
        res = await fetch(`/api/events/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save event");
      }

      onEventSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete event");
      }

      if (onEventDeleted) {
        onEventDeleted();
      } else {
        onEventSaved();
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
                {isEditing ? "Event Details & Edit" : "Schedule New Event"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? "Update or remove this scheduled item" : "Create a personal or course group deadline"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Distributed Systems Quiz 2 or Study Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEditOrDelete}
              required
            />
          </div>

          {/* Event Type selector pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Event Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((t) => {
                const config = EVENT_TYPE_CONFIG[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!canEditOrDelete}
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start and End Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  disabled={!canEditOrDelete}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                End Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                disabled={!canEditOrDelete}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Target Group association (if not fixed to a group) */}
          {!fixedGroupId && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Scope / Destination
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={!canEditOrDelete}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Personal Schedule (Private to me)</option>
                {userGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    Group: {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Private flag if personal */}
          {!selectedGroupId && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={!canEditOrDelete}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 select-none">
                Mark as strictly private (hidden from mutual profile calendars)
              </span>
            </label>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description & Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add agenda, room number, preparation notes, or syllabus topics..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEditOrDelete}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
          </div>

          {/* Creator & Group Info (if viewing an existing event) */}
          {event && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              {event.creator && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Scheduled by:</span>
                  <span>{event.creator.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-bold uppercase">
                    {event.creator.role}
                  </span>
                </div>
              )}
              {event.group && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Course Group:</span>
                  <span>{event.group.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer / Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
            {isEditing && canEditOrDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
                className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              {canEditOrDelete && (
                <Button type="submit" variant="primary" size="sm" isLoading={isLoading} className="text-xs">
                  {isEditing ? "Save Changes" : "Create Event"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
