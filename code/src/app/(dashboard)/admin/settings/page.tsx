"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Plus,
  Loader2,
  Lock,
  Globe,
  Mail,
  Sparkles,
  X,
} from "lucide-react";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface SystemSettings {
  id: string;
  joinPolicy: "OPEN" | "DOMAIN_RESTRICTED" | "INVITE_ONLY";
  allowedDomains: string;
  aiModerationEnabled: boolean;
  aiSensitivity: "STRICT" | "MODERATE" | "LENIENT";
  updatedAt: string;
}

interface InviteItem {
  id: string;
  token: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  label: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
  inviteUrl: string;
  isExpired: boolean;
  isExhausted: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [aiStats, setAiStats] = useState<{ dailyFlaggedCount: number; totalFlaggedCount: number }>({
    dailyFlaggedCount: 0,
    totalFlaggedCount: 0,
  });
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite form state
  const [inviteRole, setInviteRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState(1);
  const [inviteExpiryHours, setInviteExpiryHours] = useState(72);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, invitesRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/invite"),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettings(sData.settings);
        if (sData.stats) {
          setAiStats(sData.stats);
        }
      }
      if (invitesRes.ok) {
        const iData = await invitesRes.json();
        setInvites(iData.invites || []);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Failed to load settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save System Settings
  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinPolicy: settings.joinPolicy,
          allowedDomains: settings.allowedDomains,
          aiModerationEnabled: settings.aiModerationEnabled,
          aiSensitivity: settings.aiSensitivity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update settings");

      setSettings(data.settings);
      showToast("Platform registration and AI settings updated successfully.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error updating settings", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Create new invite
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingInvite(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: inviteRole,
          label: inviteLabel.trim() || undefined,
          maxUses: inviteMaxUses,
          expiresInHours: inviteExpiryHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate invite");

      showToast(`Generated new invite link for ${inviteRole}.`);
      setInviteLabel("");
      setInviteMaxUses(1);
      // Reload invites list
      const updatedInvitesRes = await fetch("/api/admin/invite");
      if (updatedInvitesRes.ok) {
        const iData = await updatedInvitesRes.json();
        setInvites(iData.invites || []);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error generating invite", "error");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  // Revoke invite
  const handleRevokeInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/invite?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to revoke invite");

      showToast("Invite link revoked.");
      setInvites((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error revoking invite", "error");
    }
  };

  // Copy link helper
  const handleCopyLink = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
    showToast("Invite link copied to clipboard.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <AdminSubNav
        title="Settings & Access Policies"
        description="Configure institutional registration barriers, tune Gemini AI safety guardrails, and generate role-bound invite tokens."
      />

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium transition-all ${toastMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          <p className="text-sm font-medium text-slate-500">Loading system settings...</p>
        </div>
      ) : settings ? (
        <div className="space-y-8">
          {/* Main Grid: Policy & AI Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Card 1: Registration & Access Policy */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Campus Access Policy</h3>
                  <p className="text-xs text-slate-400">Control who can create an account on CampusConnect</p>
                </div>
              </div>

              {/* Policy Options */}
              <div className="space-y-3">
                {[
                  {
                    value: "OPEN",
                    title: "Open Community",
                    description: "Anyone can register without email domain restrictions or invite codes.",
                    icon: Globe,
                  },
                  {
                    value: "DOMAIN_RESTRICTED",
                    title: "Domain Restricted",
                    description: "Registrations require a verified institutional email matching allowed domains.",
                    icon: Mail,
                  },
                  {
                    value: "INVITE_ONLY",
                    title: "Strict Invite Only",
                    description: "Registration requires a valid, pre-generated invite code from an administrator.",
                    icon: Lock,
                  },
                ].map((policy) => {
                  const Icon = policy.icon;
                  const isSelected = settings.joinPolicy === policy.value;

                  return (
                    <div
                      key={policy.value}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          joinPolicy: policy.value as SystemSettings["joinPolicy"],
                        })
                      }
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${isSelected
                          ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
                        }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-slate-300 dark:border-slate-700"
                          }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-rose-600" : "text-slate-400"}`} />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{policy.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{policy.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Domain Restrictions Input (Shown if DOMAIN_RESTRICTED) */}
              {settings.joinPolicy === "DOMAIN_RESTRICTED" && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                  <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span>Allowed University Email Domains</span>
                  </label>
                  <input
                    type="text"
                    value={settings.allowedDomains}
                    onChange={(e) => setSettings({ ...settings, allowedDomains: e.target.value })}
                    placeholder="campus.edu, thapar.edu, alumni.campus.edu"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Separate multiple domains with commas. Users must sign up with an email matching one of these domains.
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: AI Safety & Moderation Controls */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Content Guardrails</h3>
                    <p className="text-xs text-slate-400">Powered by Google Gemini 2.5 Flash agent</p>
                  </div>
                </div>

                {/* Master Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      aiModerationEnabled: !settings.aiModerationEnabled,
                    })
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${settings.aiModerationEnabled ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${settings.aiModerationEnabled ? "translate-x-6" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 text-xs text-purple-900 dark:text-purple-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Agent Status: {settings.aiModerationEnabled ? "Active & Scanning" : "Disabled"}</span>
                </div>
                <p>
                  When enabled, all incoming posts and comments are analyzed before publication. Violations are
                  automatically hidden and routed to the moderation queue.
                </p>
              </div>

              {/* Daily and Total Flagged Stats Widgets */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Daily Flagged Posts</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {aiStats.dailyFlaggedCount}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      24h
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Intercepted today</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Total Intercepted</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {aiStats.totalFlaggedCount}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      All-time
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Safety actions taken</span>
                </div>
              </div>

              {/* Sensitivity Levels */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-slate-400">Detection Sensitivity</label>
                {[
                  {
                    value: "STRICT",
                    title: "Strict (Zero Tolerance)",
                    desc: "Flags coarse language, heated uncivil arguments, academic dishonesty, and aggressive tones.",
                  },
                  {
                    value: "MODERATE",
                    title: "Moderate (Standard Community)",
                    desc: "Flags hate speech, harassment, threats, and explicit material. Allows friendly campus banter and slang.",
                  },
                  {
                    value: "LENIENT",
                    title: "Lenient (High Threshold)",
                    desc: "Only flags explicit, severe violations and direct threats. Tolerates colloquial arguments and strong opinions.",
                  },
                ].map((sens) => {
                  const isSelected = settings.aiSensitivity === sens.value;

                  return (
                    <div
                      key={sens.value}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          aiSensitivity: sens.value as SystemSettings["aiSensitivity"],
                        })
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
                          ? "border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 ring-1 ring-purple-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{sens.title}</span>
                        {isSelected && <span className="text-xs font-bold text-purple-600">Selected</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sens.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Save Settings Action Bar */}
          <div className="flex items-center justify-end p-4 bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <Button onClick={handleSaveSettings} isLoading={isSavingSettings} size="md">
              Save Platform Policies
            </Button>
          </div>

          {/* Section 3: Invite Links & Codes Management */}
          <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Campus Invite Links</h3>
                  <p className="text-xs text-slate-400">
                    Generate role-bound, time-limited invitations for batches, labs, or faculty onboarding
                  </p>
                </div>
              </div>
            </div>

            {/* Create Invite Form */}
            <form
              onSubmit={handleCreateInvite}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
            >
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Target Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "STUDENT" | "TEACHER")}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Faculty / Teacher</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Note / Label</label>
                <input
                  type="text"
                  placeholder="e.g. CSE Batch 2026"
                  value={inviteLabel}
                  onChange={(e) => setInviteLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Max Uses</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={inviteMaxUses}
                  onChange={(e) => setInviteMaxUses(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Expires In (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={inviteExpiryHours}
                  onChange={(e) => setInviteExpiryHours(parseInt(e.target.value, 10) || 72)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <Button type="submit" size="sm" isLoading={isCreatingInvite} className="w-full h-10 gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Generate Link</span>
                </Button>
              </div>
            </form>

            {/* Invites Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Label</th>
                    <th className="py-3 px-4">Token Key</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Expiry</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {invites.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No active invite tokens found. Generate one above to onboard new cohorts.
                      </td>
                    </tr>
                  ) : (
                    invites.map((inv) => {
                      const isExpired = inv.isExpired;
                      const isExhausted = inv.isExhausted;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          {/* Role */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${inv.role === "TEACHER"
                                  ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                }`}
                            >
                              {inv.role}
                            </span>
                          </td>

                          {/* Label */}
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {inv.label || "—"}
                          </td>

                          {/* Token */}
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {inv.token.slice(0, 12)}...
                          </td>

                          {/* Redemptions */}
                          <td className="py-3 px-4 font-medium">
                            <span className={inv.usedCount >= inv.maxUses ? "text-amber-600 font-bold" : ""}>
                              {inv.usedCount} / {inv.maxUses}
                            </span>
                          </td>

                          {/* Expiry */}
                          <td className="py-3 px-4">
                            {isExpired ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">Expired</span>
                            ) : isExhausted ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">Exhausted</span>
                            ) : (
                              <span className="text-slate-500">{formatDate(new Date(inv.expiresAt))}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Copy Link */}
                              <button
                                type="button"
                                onClick={() => handleCopyLink(inv.inviteUrl, inv.token)}
                                title="Copy full registration link"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              >
                                {copiedToken === inv.token ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>

                              {/* Revoke */}
                              <button
                                type="button"
                                onClick={() => handleRevokeInvite(inv.id)}
                                title="Revoke invite token"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

