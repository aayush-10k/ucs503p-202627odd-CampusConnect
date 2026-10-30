"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Filter,
  MoreVertical,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Users,
  FolderArchive,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getInitials, formatDate } from "@/lib/utils";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  avatar: string | null;
  department: string | null;
  batch: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  _count: {
    posts: number;
    groupMemberships: number;
    materials: number;
  };
}

interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function UserTable() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [pagination, setPagination] = useState<UserPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Action states
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<AdminUserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search.trim(),
        role: roleFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Error loading users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  // Handle role modification
  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");

      showToast(`Role updated to ${selectedRole} for ${editingUser.name}.`);
      setEditingUser(null);
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error updating role", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle suspension toggle
  const handleToggleSuspension = async () => {
    if (!suspendingUser) return;
    setActionLoading(true);
    try {
      const newSuspendedState = !suspendingUser.isSuspended;
      const res = await fetch(`/api/admin/users/${suspendingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: newSuspendedState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change suspension");

      showToast(
        newSuspendedState
          ? `Account suspended for ${suspendingUser.name}.`
          : `Account unsuspended for ${suspendingUser.name}.`
      );
      setSuspendingUser(null);
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error updating suspension", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle deletion
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");

      showToast(`User ${deletingUser.name} deleted successfully.`);
      setDeletingUser(null);
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error deleting user", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium transition-all ${
            toastMessage.type === "success"
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

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Faculty</option>
            <option value="ADMIN">Admins</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="ALL">All Accounts</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department & Batch</th>
                <th className="py-3.5 px-4">Engagement</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
                      <span className="text-xs">Loading user records...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No users matching the selected query or filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {user.name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 block truncate">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
                              : user.role === "TEACHER"
                              ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Department & Batch */}
                      <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <div>{user.department || "—"}</div>
                        {user.batch && <div className="text-[11px] text-slate-400 font-mono">Class of {user.batch}</div>}
                      </td>

                      {/* Engagement Counts */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span title="Posts" className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            {user._count?.posts || 0}
                          </span>
                          <span title="Groups" className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {user._count?.groupMemberships || 0}
                          </span>
                          <span title="Materials" className="flex items-center gap-1">
                            <FolderArchive className="w-3.5 h-3.5 text-slate-400" />
                            {user._count?.materials || 0}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {user.isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                            <UserX className="w-3 h-3" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                            <UserCheck className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(new Date(user.createdAt))}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Change Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setSelectedRole(user.role);
                            }}
                            disabled={isSelf}
                            title={isSelf ? "Cannot modify your own role" : "Modify User Role"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          {/* Suspension Button */}
                          <button
                            type="button"
                            onClick={() => setSuspendingUser(user)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "Cannot suspend your own account"
                                : user.isSuspended
                                ? "Unsuspend account"
                                : "Suspend account"
                            }
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                              user.isSuspended
                                ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            }`}
                          >
                            {user.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
                            disabled={isSelf}
                            title={isSelf ? "Cannot delete your own account" : "Delete User"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{users.length}</span> of{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{pagination.total}</span> users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="h-8 px-2.5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <Shield className="w-5 h-5" />
                <h3 className="text-base text-slate-900 dark:text-white">Change Account Role</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Modifying permissions for <strong className="text-slate-800 dark:text-slate-200">{editingUser.name}</strong> ({editingUser.email}).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Select New Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(["STUDENT", "TEACHER", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedRole === r
                        ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-600"
                        : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={() => setEditingUser(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdateRole} isLoading={actionLoading}>
                Save Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {suspendingUser.isSuspended ? "Unsuspend Account" : "Suspend Account"}
                </h3>
                <p className="text-xs text-slate-500">
                  {suspendingUser.isSuspended
                    ? "Restore platform access for this user."
                    : "Prevent this user from logging in or posting."}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              User: <strong className="text-slate-900 dark:text-white">{suspendingUser.name}</strong> (
              {suspendingUser.email})
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSuspendingUser(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={suspendingUser.isSuspended ? "primary" : "secondary"}
                onClick={handleToggleSuspension}
                isLoading={actionLoading}
              >
                {suspendingUser.isSuspended ? "Unsuspend User" : "Confirm Suspension"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User Permanently</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
              Are you sure you want to delete <strong className="text-rose-700 dark:text-rose-300">{deletingUser.name}</strong> ({deletingUser.email})?
              All associated posts, group memberships, and materials will be removed or cascade cleaned.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingUser(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteUser}
                isLoading={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

