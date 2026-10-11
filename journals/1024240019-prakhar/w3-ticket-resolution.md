# Week 3 : Phase 7 & 8 — Notification Infrastructure, Live Bell UI & Platform Governance Admin APIs

**Author:** Prakhar Saxena (Roll No. 1024240019)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 7 (Notifications) & Phase 8 (Admin Control Panel Backend)  
**Dates Active:** 09-10-2026 to 11-10-2026  

---

## 1. Overview of Assigned Tasks

During Week 3 (Sprint 3 — Stage 3), I was responsible for delivering **Phase 7 (Notifications Subsystem & Bell UI)** and **Phase 8 (Deliverable 6: Admin Control Panel APIs)**, implementing unified alert notifications and institutional governance controls:

1. **Task 7.4 — Notifications API Engine**:
   - `GET /api/notifications`: Retrieves user-specific notifications ordered chronologically descending, populated with sender information, categorized by `NotificationType` (`NEW_MESSAGE`, `NEW_EVENT`, `FRIEND_REQUEST`, `SYSTEM`), with unread tallying.
   - `PATCH /api/notifications/[id]/read`: Marks an individual notification as read upon user interaction.
   - `POST /api/notifications/read-all`: Bulk-updates all unread notifications for the session user to `isRead: true`.
2. **Task 7.5 — Live Notification Dropdown & Bell Indicator**:
   - `src/components/layout/NotificationDropdown.tsx`: Mounted in `TopNav` featuring an unread counter badge, popover tray with animated empty states, relative timestamps (`timeAgo()`), deep linking to target pages (`/messages`, `/groups/[id]/schedule`, `/friends`), and one-click "Mark all as read".
3. **Task 8.1 — Admin Control Panel REST APIs & Schema Extensions**:
   - Extended `code/prisma/schema.prisma` with the `SystemSetting` model, supporting configurable community join policies (`OPEN`, `DOMAIN_RESTRICTED`, `INVITE_ONLY`), institutional email domain whitelists (`campus.edu,thapar.edu`), and Gemini AI moderation sensitivity controls (`STRICT`, `MODERATE`, `LENIENT`).
   - `GET /api/admin/stats`: High-level institutional metrics aggregation (total students, faculty, admins, suspended accounts, active groups, published posts, flagged items, pending reports, and active invite links).
   - `GET` & `POST /api/admin/users`: User directory exploration with multi-field case-insensitive search (`name`, `email`), pagination, and administrative account provisioning.
   - `PATCH` & `DELETE /api/admin/users/[id]`: Administrative user lifecycle management allowing role modification (`ADMIN`, `TEACHER`, `STUDENT`), account suspension toggling (`isSuspended`), and complete account termination.
   - `GET` & `PATCH /api/admin/settings`: Platform governance configuration endpoints backed by Prisma upsert operations.
   - `GET` & `PATCH /api/admin/reports` & `/api/admin/reports/[id]`: Moderation incident queue endpoints enabling review actions (`APPROVE`, `DISMISS`, `REMOVE_POST`), post hiding, and audit resolution logging.

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: Dynamic Schema Extension for Singleton Platform Governance (`SystemSetting`)

#### Error / Problem Encountered:
Platform governance configurations (e.g., domain whitelists, auto-moderation toggles, and join policies) must persist across server restarts and edge serverless invocations. Storing these settings in environment variables requires full application rebuilds and deployments to change policy rules. Conversely, creating a multi-row relational table introduces race conditions and ambiguity regarding which row constitutes the active institutional policy.

#### Key Observation:
By enforcing a deterministic primary key constraint (e.g., `id = "default"`) within a dedicated `SystemSetting` model and using Prisma's `upsert` query, the database guarantees exactly one canonical settings record is maintained, allowing administrators to update campus policies at runtime without server downtime.

#### Solution:
Modeled `SystemSetting` in `code/prisma/schema.prisma` and implemented runtime upsert in `src/app/api/admin/settings/route.ts`:
```prisma
model SystemSetting {
  id                  String   @id @default("default")
  joinPolicy          String   @default("OPEN")
  allowedDomains      String   @default("campus.edu,thapar.edu")
  aiModerationEnabled Boolean  @default(true)
  aiSensitivity       String   @default("MODERATE")
  updatedAt           DateTime @updatedAt
}
```
```typescript
const updateSettingsSchema = z.object({
  joinPolicy: z.enum(["OPEN", "DOMAIN_RESTRICTED", "INVITE_ONLY"]).optional(),
  allowedDomains: z.string().trim().optional(),
  aiModerationEnabled: z.boolean().optional(),
  aiSensitivity: z.enum(["STRICT", "MODERATE", "LENIENT"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation error" }, { status: 400 });
  }

  const updatedSettings = await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: {
      id: "default",
      ...parsed.data,
    },
  });

  return NextResponse.json({ settings: updatedSettings });
}
```
This enables zero-downtime policy adjustments directly from the administration interface.

---

### Issue B: Moderation Report Lifecycle & Coordinated Post Sanitization

#### Error / Problem Encountered:
When an administrator reviews a flagged post in the moderation queue, resolving the incident involves multiple dependent operations: updating the report status (`PENDING` $\to$ `RESOLVED` / `DISMISSED` / `REMOVED`), recording the review timestamp, and altering the underlying post's state (`isHidden: true`, `isFlagged: false`). Executing these updates non-atomically caused split-brain scenarios where a report was marked resolved but the offensive post remained visible in student feeds.

#### Key Observation:
Incident resolution must execute within an atomic transaction. If the action is `REMOVE_POST`, the post must be hidden from all feeds simultaneously while preserving the post entity for institutional disciplinary auditing.

#### Solution:
Engineered atomic triage handling in `src/app/api/admin/reports/[id]/route.ts`:
```typescript
const { status, action } = parsed.data;

let finalStatus: ReportStatus = ReportStatus.REVIEWED;
if (status) finalStatus = status;
else if (action === "REMOVE_POST") finalStatus = ReportStatus.REMOVED;
else if (action === "DISMISS") finalStatus = ReportStatus.DISMISSED;

const updatedReport = await prisma.$transaction(async (tx) => {
  // If post should be removed, hide it from public feed
  if (action === "REMOVE_POST" && report.postId) {
    await tx.post.update({
      where: { id: report.postId },
      data: { isHidden: true },
    });
  }

  return await tx.moderationReport.update({
    where: { id },
    data: {
      status: finalStatus,
      reviewedAt: new Date(),
    },
  });
});
```
This guarantees synchronized state across moderation reports and public community feeds.

---

## 3. Verification & Empirical Testing

On **11-10-2026**, Phase 8 APIs and the notification pipeline were comprehensively verified using `code/scripts/verify-phase8.ts`:

1. **Admin Persona & Access Gate Verification:**
   - Verified that seeded administrator (`admin@campus.edu`) was present with `Role.ADMIN`.
   - Confirmed that non-admin requests to all `/api/admin/*` endpoints strictly returned `403 Forbidden`.
2. **Platform Stats Aggregation (Task 8.1):**
   - Executed parallel database counts (`Promise.all`); successfully retrieved user distribution (Students, Teachers, Admins), group count, post count, flagged items, and pending moderation tickets.
3. **User Management Lifecycle (Task 8.1):**
   - Created temporary test student account; verified retrieval via case-insensitive search queries.
   - Updated user role to `TEACHER` and toggled `isSuspended: true`; verified persistence.
   - Deleted temporary user; confirmed cascading removal.
4. **Platform Settings & Moderation Queue:**
   - Upserted default `SystemSetting`; verified policy updates to `DOMAIN_RESTRICTED` and `aiSensitivity: STRICT`.
   - Created test moderation report; listed report in pending queue; reviewed and dismissed report; verified `reviewedAt` timestamp was set.

---

## 4. Key Takeaways & Architectural Learnings

- **Singleton Pattern for System Configuration:** Using fixed-key database upserts provides an optimal middle ground between static environment configurations and complex multi-tenant tables.
- **Auditable Content Moderation:** Shadow-hiding non-compliant posts (`isHidden: true`) rather than performing hard deletes preserves essential forensic evidence for disciplinary boards.
- **Bulk Notification Efficiency:** Providing bulk read-receipt endpoints minimizes redundant client-server handshakes and maintains high database connection throughput.
