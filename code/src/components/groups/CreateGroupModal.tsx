"use client";

import React, { useState } from "react";
import { X, BookOpen, Users, FlaskConical, Sparkles, Globe, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"SUBJECT" | "BATCH" | "LAB" | "CLUB">("SUBJECT");
  const [isGroupOpen, setIsGroupOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name for the group.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          isOpen: isGroupOpen,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create group.");
      }

      setName("");
      setDescription("");
      setType("SUBJECT");
      setIsGroupOpen(true);
      onGroupCreated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create group.");
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions = [
    { value: "SUBJECT", label: "Subject / Course", icon: BookOpen, desc: "Lecture notes, syllabus, and queries" },
    { value: "BATCH", label: "Year / Batch", icon: Users, desc: "General batch announcements and discussions" },
    { value: "LAB", label: "Laboratory", icon: FlaskConical, desc: "Lab manuals, code assignments, submissions" },
    { value: "CLUB", label: "Club / Society", icon: Sparkles, desc: "Extracurriculars, hackathons, seminars" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B0F19] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-2">
            Academic Infrastructure
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
            Create Academic Group
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Establish a verified workspace for course materials, announcements, and peer collaboration.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Group Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. UCS503 — Software Engineering (Batch 2024)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Objective
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context on course syllabus, weekly meeting schedule, or project expectations..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none"
            />
          </div>

          {/* Group Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Group Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex items-start gap-2.5 p-3 text-left rounded-2xl border transition-all ${
                      isSelected
                        ? "border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 text-slate-900 dark:text-white ring-1 ring-rose-500/30"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`} />
                    <div>
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Access Policy (Open vs Closed) */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Enrollment Policy
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsGroupOpen(true)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  isGroupOpen
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Open for All Students</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGroupOpen(false)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  !isGroupOpen
                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Invite Only / Closed</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
