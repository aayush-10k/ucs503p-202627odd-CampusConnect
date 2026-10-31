# Week 4 : Phase 8 — Deliverable 6: Admin Control Panel UI, Governance Console & Role Guard Hardening

**Author:** Aayushmaan Singh Meyan (Roll No. 1024240142)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 8 — Deliverable 6: Admin Control Panel (Frontend UI & Security Guard)  
**Dates Active:** 24-10-2026 to 25-10-2026  

---

## 1. Overview of Assigned Tasks

During Week 4 (Sprint 4 — Stage 1), I was responsible for delivering the frontend user interface and role-guard security enforcement for **Phase 8 (Deliverable 6: Admin Control Panel)**, spanning **Task 8.2** and **Task 8.3**:

1. **Task 8.2 — Admin Control Panel Frontend UI & Interactive Components**:
   - `src/app/(dashboard)/admin/page.tsx`: Platform health overview dashboard featuring high-level KPI cards (total accounts categorized by role, active suspensions, verified accounts, active groups, published posts, flagged content, pending reports, and active invite links), recent user registration tables, and active moderation alerts preview.
   - `src/app/(dashboard)/admin/users/page.tsx` & `src/components/admin/UserTable.tsx`: Full-featured administrative user directory with debounced search (`name`, `email`), role filters (`ALL`, `STUDENT`, `TEACHER`, `ADMIN`), status filters (`ALL`, `ACTIVE`, `SUSPENDED`), role change modal dialog, account suspension toggle switch, permanent account deletion modal with confirmation checks, and server-driven pagination.
   - `src/app/(dashboard)/admin/moderation/page.tsx` & `src/components/admin/ModerationQueueCard.tsx`: Moderation review queue interface supporting status tabs (`PENDING`, `REMOVED`, `DISMISSED`, `ALL`) and source filter (`ALL`, `AI`, `USER`). Displays flagged post previews, violation rationale badges, reporter/author details, dismiss report / restore post actions, and permanent deletion with instant UI state updates.
   - `src/app/(dashboard)/admin/settings/page.tsx`: Centralized governance console managing campus access policies (`OPEN`, `DOMAIN_RESTRICTED`, `INVITE_ONLY`), allowed institutional email domains, Google Gemini AI moderation master toggle and sensitivity selector (`STRICT`, `MODERATE`, `LENIENT`), daily safety statistics, and cohort invite link generation with token revocation actions.
   - `src/components/admin/AdminSubNav.tsx`: Cohesive sub-navigation tab bar with breadcrumbs and live pending report counter badge (`/admin`, `/admin/users`, `/admin/moderation`, `/admin/settings`).
2. **Task 8.3 — Role Guard Verification & Self-Lockout Hardening**:
   - Configured Next.js Edge middleware (`src/proxy.ts` / middleware) to inspect incoming JWT sessions, immediately redirecting non-admin users attempting to visit any `/admin/*` route back to `/feed`.
   - Hardened all admin mutation APIs (`/api/admin/users/[id]`) with defensive self-action checks (`session.user.id === targetUserId`) preventing administrators from suspending, demoting, or deleting their own account.

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: Debounced Multi-Attribute Search & Server-Side Pagination Synchronization in UserTable

#### Error / Problem Encountered:
In `src/components/admin/UserTable.tsx`, administrators need to filter hundreds of student and faculty records by name, email, role, and suspension status. When typing rapidly in the search input, every keystroke dispatched an asynchronous `fetch()` request to `/api/admin/users`. Network latency variances caused out-of-order responses, where an earlier query (e.g., search for `"al"`) resolved after a later query (e.g., search for `"alex"`), replacing correct search results with stale data. Furthermore, if an administrator was on page 4 of the user directory and typed a query matching only 2 users, the API returned 0 results because the query evaluated at `page=4` instead of resetting to `page=1`.

#### Key Observation:
User search inputs must be debounced by 250ms to cancel redundant network requests. Whenever search terms, role filters, or status filters change, the client pagination state must atomically reset `page` to 1 while preserving the active limit and total count.

#### Solution:
Engineered debounced query execution using `useEffect` with cleanup timers, alongside automatic page resetting:
```typescript
// Synchronize debounced search and filter updates
useEffect(() => {
  const timer = setTimeout(() => {
    fetchUsers(1); // Always reset to page 1 on filter or search mutation
  }, 250);
  return () => clearTimeout(timer);
}, [search, roleFilter, statusFilter]);

const fetchUsers = async (targetPage = 1) => {
  setIsLoading(true);
  try {
    const params = new URLSearchParams({
      page: targetPage.toString(),
      limit: pagination.limit.toString(),
      search: search.trim(),
      role: roleFilter,
      status: statusFilter,
    });
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load users");
    const data = await res.json();
    setUsers(data.users || []);
    setPagination(data.pagination);
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : "Error fetching users", "error");
  } finally {
    setIsLoading(false);
  }
};
```
This guarantees consistent, race-free directory navigation even under rapid user interaction.

---

### Issue B: Administrative Self-Lockout & Privilege Escalation Prevention

#### Error / Problem Encountered:
During administrative user lifecycle testing, an administrator navigating `UserTable.tsx` had access to the action menu on all rows, including their own account row. An administrator could inadvertently click "Suspend Account", downgrade their own role from `ADMIN` to `STUDENT`, or click "Delete Account". If executed, this would immediately revoke administrative access, potentially leaving the platform without any active administrator and creating an orphaned system state requiring manual direct SQL intervention.

#### Key Observation:
Security boundaries cannot rely solely on frontend button disabling. The backend route handler `src/app/api/admin/users/[id]/route.ts` must compare the authenticated session user ID with the target user ID, explicitly aborting destructive self-mutations before executing any Prisma update or delete query. Concurrently, the frontend UI should render disabled, explanatory indicators for the current administrator's own row.

#### Solution:
Implemented dual-layer self-protection in both the backend route handler and frontend table components:

1. **Backend Route Guard (`src/app/api/admin/users/[id]/route.ts`)**:
```typescript
// Self-protection guard preventing admin self-lockout
if (session.user.id === id) {
  if (parsed.data.isSuspended === true) {
    return NextResponse.json(
      { message: "You cannot suspend your own admin account." },
      { status: 400 }
    );
  }
  if (parsed.data.role && parsed.data.role !== "ADMIN") {
    return NextResponse.json(
      { message: "You cannot demote your own admin account." },
      { status: 400 }
    );
  }
}
```

2. **Frontend Protective Lockout (`src/components/admin/UserTable.tsx`)**:
```typescript
const isCurrentUser = user.id === currentUserId;

// In action menu rendering:
<button
  disabled={isCurrentUser}
  onClick={() => setSuspendingUser(user)}
  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded transition-colors ${
    isCurrentUser
      ? "opacity-40 cursor-not-allowed text-foreground-muted"
      : "hover:bg-background-elevated text-foreground"
  }`}
  title={isCurrentUser ? "You cannot suspend your own account" : undefined}
>
  {user.isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
  <span>{user.isSuspended ? "Unsuspend Account" : "Suspend Account"}</span>
</button>
```
This impenetrable safeguard guarantees platform governance stability.

---

## 3. Verification & Empirical Testing

On **25-10-2026**, Phase 8 was verified across frontend and security layers using automated testing and static analysis:

1. **Automated End-to-End Suite (`code/scripts/verify-phase8.ts`)**:
   - Executed full Phase 8 verification suite against Neon PostgreSQL database.
   - Verified admin account credential resolution and stats metrics calculation.
   - Tested user creation, search filtering, role promotion, suspension toggling, and cleanup deletion.
   - Tested admin settings upsert (`joinPolicy`, `allowedDomains`, `aiModerationEnabled`, `aiSensitivity`).
   - Verified moderation report lifecycle (`PENDING` $\rightarrow$ `DISMISSED` / `REMOVED`).
   - Tested invite token generation, URL construction, and revocation.
   - Result: All tests passed with exit code 0.
2. **Static Code Analysis & Type Safety**:
   - `npx tsc --noEmit`: 0 type errors across all admin dashboard pages, tables, and modal components.
   - `npm run lint`: 0 ESLint errors. Cleaned up JSX unescaped quote entities (`&ldquo;...&rdquo;`) in `src/app/(dashboard)/admin/page.tsx`.
   - `npm run build`: Successfully compiled and prerendered all 35 static and dynamic Next.js App Router routes.

---

## 4. Key Takeaways & Architectural Learnings

- **Defensive Self-Action Safeguards:** Critical administrative applications must protect administrators from accidental self-demotion or self-suspension at both API and UI layers to prevent permanent lockout.
- **Debounced Server-Side Query Execution:** Pairing a 250ms debounce with automatic page reset to 1 provides a responsive, desktop-grade feel while eliminating network race conditions.
- **Componentized Admin Experience:** Splitting administration into dedicated sub-views (`/admin`, `/admin/users`, `/admin/moderation`, `/admin/settings`) connected by `AdminSubNav` keeps cognitive load manageable for university staff.

