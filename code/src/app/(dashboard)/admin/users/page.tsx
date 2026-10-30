"use client";

import React from "react";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { UserTable } from "@/components/admin/UserTable";

export default function AdminUsersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <AdminSubNav
        title="User Management Directory"
        description="Inspect registered campus users, update permissions and faculty roles, manage suspensions, or purge accounts."
      />

      <UserTable />
    </div>
  );
}

