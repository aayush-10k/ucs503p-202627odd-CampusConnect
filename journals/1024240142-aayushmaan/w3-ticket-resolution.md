# Week 3 : Phase 6 — Academic Schedule Board, Calendar System & Event Notification Dispatch

**Author:** Aayushmaan Singh Meyan (Roll No. 1024240142)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 6 — Deliverable 4: Schedule Board  
**Dates Active:** 04-10-2026 to 06-10-2026  

---

## 1. Overview of Assigned Tasks

During Week 3 (Sprint 3 — Stage 1), I was responsible for delivering **Phase 6 (Deliverable 4: Schedule Board)**, establishing the unified campus academic scheduling and reminder infrastructure:

1. **Task 6.1 — Events API (`src/app/api/events/route.ts`, `src/app/api/events/[id]/route.ts`, `src/app/api/groups/[id]/events/route.ts`)**:
   - `GET /api/events`: Multi-dimensional filtering across event types (`LECTURE`, `LAB`, `ASSIGNMENT`, `EXAM`, `WORKSHOP`, `HOLIDAY`, `DEADLINE`, `REMINDER`, `MEETING`, `OTHER`), month/year intervals, and group memberships.
   - `POST /api/events`: Type-safe creation with Zod validation. Enforces strict authorization policies preventing standard students from scheduling non-private global events while allowing personal reminders (`isPrivate: true`, `groupId: null`).
   - `PATCH` & `DELETE /api/events/[id]`: Protected modification and cancellation endpoints restricted to the event creator or platform administrators.
   - `GET` & `POST /api/groups/[id]/events`: Dedicated group schedule endpoints allowing instructors and group admins to publish course deadlines and lab sessions with automatic membership checks.
2. **Task 6.2 — Interactive Schedule UI & Event Modal**:
   - `src/components/schedule/CalendarView.tsx`: Responsive monthly calendar grid with month navigation, event badge pills color-coded by `EventType`, and day-expansion sidebars for high-density dates.
   - `src/components/schedule/EventModal.tsx`: Comprehensive creation and editing dialog featuring accessible date-time pickers, event category selectors, and group scope association.
   - `src/app/(dashboard)/schedule/page.tsx`: Full-page campus schedule dashboard unifying personal reminders and enrolled group events with live category filtering pills.
   - `src/app/(dashboard)/groups/[groupId]/schedule/page.tsx`: Course-specific schedule tab embedded within group hubs.
3. **Task 6.3 — Event Notifications & Real-Time Alert Broadcast**:
   - Integrated event creation triggers dispatching automated `NotificationType.NEW_EVENT` notifications to all enrolled group members (excluding the creator), linking directly to `/groups/[groupId]/schedule`.

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: UTC Normalization & Month-Grid Off-by-One Boundary Errors in Next.js SSR

#### Error / Problem Encountered:
When students in different time zones or local browser environments viewed the calendar, events scheduled near midnight (e.g., `2026-10-15T00:00:00Z`) rendered on the preceding day in IST (`GMT+5:30`) or triggered SSR hydration mismatches between the Node.js server renderer and client browser DOM. Additionally, querying events using standard SQL date ranges truncated events that spanned multiple days or started on the final day of the previous calendar month.

#### Key Observation:
Calendar month grids display dates in local time while databases persist timestamps in ISO-8601 UTC. To prevent date drift, queries must calculate padded UTC boundaries covering the Sunday before the 1st of the month through the Saturday ending the month grid, and all client date formatting must operate on normalized day indices.

#### Solution:
Engineered strict UTC boundary calculation in `src/app/api/events/route.ts` and `CalendarView.tsx`:
```typescript
if (monthParam && yearParam) {
  const year = parseInt(yearParam, 10);
  const month = parseInt(monthParam, 10) - 1; // 0-indexed month

  // Create start of month and end of month in UTC
  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  // Extend boundaries by 7 days to cover calendar padding days
  const paddedStart = new Date(startOfMonth.getTime() - 7 * 24 * 60 * 60 * 1000);
  const paddedEnd = new Date(endOfMonth.getTime() + 7 * 24 * 60 * 60 * 1000);

  whereConditions.push({
    startDate: { lte: paddedEnd },
    OR: [
      { endDate: { gte: paddedStart } },
      { endDate: null, startDate: { gte: paddedStart } },
    ],
  });
}
```
This guarantees consistent 42-cell monthly calendar layouts without date-skipping artifacts.

---

### Issue B: Granular Authorization & Scope Isolation (Personal vs. Group Events)

#### Error / Problem Encountered:
Students must be empowered to create private reminders on their personal calendar without broadcasting them to peers. Conversely, allowing unverified students to schedule mandatory lectures or exam dates in academic course groups creates false schedule circulars and disrupts class coordination.

#### Key Observation:
The event authorization engine must evaluate three distinct event scopes:
1. Personal events (`groupId: null`, `isPrivate: true`): accessible and mutable exclusively by the creator.
2. Group events (`groupId: string`): viewable by all enrolled members; schedulable exclusively by instructors (`Role.TEACHER`), platform admins (`Role.ADMIN`), or group moderators (`GroupMemberRole.ADMIN`).
3. Institutional global events (`isPrivate: false`, `groupId: null`): reserved exclusively for `Role.ADMIN`.

#### Solution:
Implemented strict tier-based validation inside `src/app/api/events/route.ts`:
```typescript
// Authorize group event scheduling
if (groupId) {
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: session.user.id },
  });

  const isStaff = session.user.role === "TEACHER" || session.user.role === "ADMIN";
  const isGroupLead = membership?.role === "ADMIN";

  if (!isStaff && !isGroupLead) {
    return NextResponse.json(
      { error: "Only instructors or group admins can schedule group events." },
      { status: 403 }
    );
  }
} else if (!isPrivate && session.user.role !== "ADMIN") {
  // Public platform-wide events restricted to Admins
  return NextResponse.json(
    { error: "Only administrators can schedule public campus events." },
    { status: 403 }
  );
}
```
This cleanly enforces academic integrity across personal, course, and university schedule scopes.

---

## 3. Verification & Empirical Testing

On **06-10-2026**, Phase 6 was verified using the automated test suite `code/scripts/verify-phase6.ts`:

1. **Seed Personas & Group Hierarchy:**
   - Verified active personas: Teacher (`teacher@campus.edu`), Student A (`alex@campus.edu`), Student B (`priya@campus.edu`).
   - Initialized test group `"TEST — Phase 6 Robotics Workshop"` with Teacher as Admin and students as members.
2. **Personal Event Lifecycle (Task 6.1):**
   - Student Alex created personal reminder `"Review Operating Systems Chapter 4"`; verified `isPrivate: true` and `creatorId: alex.id`.
   - Updated event title and type to `EventType.ASSIGNMENT` via `PATCH /api/events/[id]`; verified atomic field update.
3. **Faculty Group Scheduling & Member Notifications (Task 6.1 & 6.3):**
   - Faculty scheduled lecture `"Robotics Hardware Lab Midterm Review Session"` attached to the group.
   - Verified automated trigger created 2 notifications (`NotificationType.NEW_EVENT`) for members Alex and Priya linking to `/groups/[id]/schedule`.
4. **Multi-dimensional Filtering:**
   - Queried events using `type: LECTURE` and date ranges; confirmed zero query leakage into un-enrolled students' calendars.

---

## 4. Key Takeaways & Architectural Learnings

- **Padded UTC Query Windows:** Querying calendar data with 7-day padding around month edges ensures that partial weeks rendering on month grids never experience empty cells or split-second refetches.
- **Event-Driven Member Notifications:** Decoupling event persistence from recipient notification generation ensures fast HTTP response times when broadcasting schedules across large class rosters.
- **Color-Coded Semantic Visuals:** Differentiating academic categories (`EXAM` red, `LECTURE` blue, `ASSIGNMENT` amber, `REMINDER` purple) dramatically lowers cognitive load for students managing packed university timetables.
