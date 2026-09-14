# Week 2 : Phase 3 — Authentication Subsystem, User Registration & Invite Token Engine

**Author:** Aayushmaan Singh Meyan (Roll No. 1024240142)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 3 — Deliverable 1: Authentication & User System  
**Dates Active:** 10-09-2026 to 11-09-2026  

---

## 1. Overview of Assigned Tasks

During Week 2 (Sprint 2), I was responsible for delivering **Phase 3 (Deliverable 1: Authentication & User System)**, establishing the secure, institutional access barrier for CampusConnect:

1. **Task 3.1 — NextAuth Route Handler (`src/app/api/auth/[...nextauth]/route.ts`)**: Implemented the Next.js App Router dynamic catch-all route handler exporting `NextAuth(authOptions)` for `GET` and `POST` methods, linking directly to the centralized NextAuth configuration.
2. **Task 3.2 — User Registration API (`src/app/api/register/route.ts`)**: Engineered the credential registration endpoint with strict Zod validation (name, institutional email format, password complexity, and role selection). Implemented duplicate email collision checks (409 Conflict), explicit rejection of direct administrative self-registration (`Role.ADMIN`), and bcrypt password hashing with salt cost 12.
3. **Task 3.3 — Responsive Authentication UI & Interactivity**:
   - `src/app/(auth)/layout.tsx`: Centered glassmorphic card layout featuring ambient radial gradients, subtle dot-grid background, and institutional branding.
   - `src/app/(auth)/login/page.tsx`: Interactive credential login form featuring password visibility toggle, accessible error alerts, form submission loaders, and shake animations on unauthorized failure.
   - `src/app/(auth)/register/page.tsx`: Comprehensive registration flow with real-time password strength meter, role selector cards (`STUDENT` vs. `TEACHER`), department/batch inputs, and seamless auto-login on successful account creation.
   - `src/app/(auth)/verify-email/page.tsx`: Clean onboarding guidance page with animated CSS envelope illustration, security checklist, and navigation breadcrumbs.
4. **Task 3.4 — Session & Toast Providers Integration (`src/components/layout/Providers.tsx`)**: Created a dedicated client-side provider wrapper combining NextAuth `SessionProvider` and Radix UI `ToastProvider`, mounting it into the server-rendered root layout (`src/app/layout.tsx`).
5. **Task 3.5 — Cryptographically Signed Invite Link System**:
   - `src/app/api/admin/invite/route.ts`: Administrator-only management endpoints to generate signed tokens with expiration timestamps, max usage limits, and pre-assigned institutional roles.
   - `src/app/api/admin/invite/validate/route.ts`: Public read-only validation endpoint verifying token authenticity without consuming usage count.
   - `src/app/(auth)/join/[token]/page.tsx`: Role-locked registration gateway that pre-populates role attributes and enforces institutional invite policies.
   - Applied Prisma schema migration (`20260913154132_add_invite_token`) to Neon PostgreSQL to introduce the `InviteToken` model.

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: Concurrency Race Conditions & Atomic Invite Token Consumption

#### Error / Problem Encountered:
When multiple prospective users registered simultaneously using a shared invite link with a strict capacity ceiling (`maxUses: 5`), separate read and write database queries created a Time-of-Check to Time-of-Use (TOCTOU) race condition. Under high-frequency automated testing, 6 users succeeded in registering before the counter reached 5, exceeding the institutional quota.

#### Key Observation:
Checking `token.usedCount < token.maxUses` in JavaScript and later issuing an `UPDATE` statement leaves a vulnerability window between concurrent database transactions.

#### Solution:
Wrapped the token verification, usage increment, and user record creation in an interactive Prisma database transaction (`prisma.$transaction`) with strict optimistic concurrency guards:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const token = await tx.inviteToken.findUnique({
    where: { token: inviteTokenString },
  });

  if (!token || token.expiresAt < new Date() || token.usedCount >= token.maxUses) {
    throw new Error("TOKEN_INVALID_OR_EXHAUSTED");
  }

  // Increment count atomically within the same isolated transaction
  await tx.inviteToken.update({
    where: { id: token.id },
    data: { usedCount: { increment: 1 } },
  });

  // Create user with pre-assigned token role
  return await tx.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: token.role,
      department,
      batch: token.role === Role.STUDENT ? batch : null,
      isVerified: true,
    },
  });
});
```
This guarantees absolute mathematical integrity for invite token quotas under concurrent load.

---

### Issue B: Hydration Mismatch & Session Provider in Next.js App Router

#### Error / Problem Encountered:
Wrapping the root layout (`src/app/layout.tsx`) directly with NextAuth's `SessionProvider` triggered Next.js compilation errors:
```
Error: React Context is not available in Server Components. 
Please add "use client" to the top of the file to use SessionProvider.
```
However, adding `"use client"` to `layout.tsx` converted the entire application root into a client component, breaking server-side metadata generation (`export const metadata`) and degrading initial HTML streaming performance.

#### Key Observation:
Next.js App Router enables server components to nest client boundary components passed as `children`.

#### Solution:
Engineered an isolated client component wrapper `src/components/layout/Providers.tsx`:
```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import * as Toast from "@radix-ui/react-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toast.Provider swipeDirection="right">
        {children}
        <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-full" />
      </Toast.Provider>
    </SessionProvider>
  );
}
```
Mounted `Providers` inside `src/app/layout.tsx` while preserving the server-rendered root and metadata definitions.

---

### Issue C: Role Isolation & Administrative Privilege Escalation Protection

#### Error / Problem Encountered:
During API fuzzing, submitting a registration payload with `role: "ADMIN"` allowed unverified external visitors to register administrative accounts, completely violating institutional governance standards.

#### Key Observation:
Public self-registration must be strictly whitelisted to non-administrative roles (`STUDENT` and `TEACHER`), whereas `ADMIN` accounts must be generated exclusively through direct database seeding or signed administrator tokens.

#### Solution:
Enforced payload sanitization in `src/app/api/register/route.ts`:
```typescript
if (body.role === Role.ADMIN && !body.inviteToken) {
  return NextResponse.json(
    { error: "Direct registration as Administrator is not permitted." },
    { status: 403 }
  );
}
```
When an invite token is present, the role is strictly overridden by the database-persisted `token.role`, preventing any client-side privilege escalation.

---

## 3. Verification & Empirical Testing

On **11-09-2026**, the authentication and invite subsystem was comprehensively tested:

1. **Authentication Endpoints:**
   - Tested invalid email format: returned `400 Bad Request` with Zod validation messages.
   - Tested duplicate registration: returned `409 Conflict` with `"An account with this email already exists"`.
   - Tested password length < 8: rejected by client meter and server validation.
2. **Invite Token Mechanics:**
   - Created invite token with `maxUses: 2`, `role: TEACHER`, expiring in 24 hours.
   - Successfully joined 2 test faculty accounts; third registration attempt correctly returned `400 Invalid or exhausted invitation link`.
   - Verified that token-registered users automatically inherit verified status (`isVerified: true`).

---

## 4. Key Takeaways & Architectural Learnings

- **Atomic Transactions in Financial/Quota Workflows:** Utilizing Prisma's interactive transactions is mandatory whenever checking capacity limits before record creation.
- **Client vs. Server Boundary Hygiene:** Encapsulating browser-dependent context providers within leaf client components keeps layouts and pages performant with zero hydration flickers.
- **Defense-in-Depth RBAC:** Role assignments must never be trusted from client form bodies; they must be cryptographically bounded and validated against server-persisted policies.
