# Week 1 : Project Architecture Scaffold, Relational Schema & Database Seeding

**Author:** Aayushmaan Singh Meyan (Roll No. 1024240142)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 0 (Project Scaffold) & Phase 1 (Database Schema & Relational Modeling)  

---

## 1. Overview of Assigned Tasks

During this initial foundation phase, I served as the team lead and was responsible for bootstrapping the complete codebase architecture and engineering the institutional relational data model:
1. **Task 0.1 to 0.7 — Project Scaffold**: Initialized Next.js 14+ with App Router, TypeScript, Tailwind CSS, and path alias `@/*`. Installed core ecosystem libraries (Prisma ORM, NextAuth.js, bcryptjs, Socket.io, Cloudinary SDK, Google Gemini AI SDK, Radix UI primitives). Configured `next.config.ts`, `.env.example`, automated development `Makefile`, and the global design token system in `src/app/globals.css`.
2. **Task 1.1 — Prisma Relational Data Schema (`prisma/schema.prisma`)**: Engineered the end-to-end database schema comprising 14 relational models and 7 domain enums modeling user roles, academic groups, course materials, schedule events, real-time messaging, and AI moderation flags.
3. **Task 1.2 — Cloud Database Migration**: Applied initial database migration (`20260906145538_init`) against our Neon Serverless PostgreSQL instance and generated the type-safe Prisma Client.
4. **Task 1.3 — Database Seeding Engine (`prisma/seed.ts`)**: Built an automated seed pipeline creating verified test personas across all 3 institution roles (Admin, Teacher, Student), default academic batch groups, and interactive initial feed activity.

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: Prisma 7 Configuration & Driver Adapter Setup in Next.js

#### Problem:
In Prisma 7, defining direct connection URLs inside `datasource db` in `schema.prisma` is deprecated in favor of external configuration objects:
```
PrismaConfigError: `datasource.url` is deprecated. Use `defineConfig` in `prisma.config.ts` with a driver adapter.
```
Additionally, Next.js with Turbopack requires explicit driver adapter resolution when targeting PostgreSQL pools on Neon Cloud.

#### Key Observation:
Prisma 7 decouples database connectivity from the schema declaration to allow dynamic connection pooling and edge-compatible driver adapters via `@prisma/adapter-pg`.

#### Solution:
Created `code/prisma.config.ts` using `defineConfig` and configured `prisma/schema.prisma` to work cleanly with the connection adapter:
```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```
This enabled seamless migration execution via `npx prisma migrate dev --name init` and instant type-safe schema synchronization.

---

### Issue B: Relational Dependency Order & Foreign Key Constraints in Seeding

#### Problem:
The CampusConnect schema has extensive relational integrity constraints (e.g., `GroupMember` requires both valid `User` and `Group` IDs; `Post` can belong to an optional `Group` and required `User`; `Comment` and `Like` depend on both `User` and `Post`). A linear seed script caused relational foreign key constraint violations:
```
PrismaClientKnownRequestError: Foreign key constraint failed on the field: `GroupMember_groupId_fkey (index)`
```

#### Key Observation:
Relational entities must be created according to topological dependency order, and password hashing must be resolved asynchronously before user insertion to ensure instant login capability in development.

#### Solution:
Engineered `prisma/seed.ts` with deterministic staged execution using `upsert` queries to prevent duplicate key collisions:
```typescript
import { PrismaClient, Role, GroupType, GroupMemberRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 1. Seed Institutional Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@campus.edu" },
    update: {},
    create: {
      name: "Campus Admin",
      email: "admin@campus.edu",
      password: hashedPassword,
      role: Role.ADMIN,
      department: "Administration",
      isVerified: true,
    },
  });

  // 2. Seed Academic Groups
  const batchGroup = await prisma.group.upsert({
    where: { id: "cse-2024-batch" },
    update: {},
    create: {
      id: "cse-2024-batch",
      name: "CSE Batch 2024",
      description: "Official discussion and updates for CSE 2024 batch students.",
      type: GroupType.BATCH,
      isOpen: true,
    },
  });

  // 3. Link Group Memberships & Seed Welcome Activity
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: admin.id, groupId: batchGroup.id } },
    update: {},
    create: { userId: admin.id, groupId: batchGroup.id, role: GroupMemberRole.ADMIN },
  });
}
```

---

### Issue C: Design Token System Architecture & Typography

#### Problem:
To build a high-grade institution platform, ad-hoc utility classes across components would lead to inconsistent visual hierarchy, inaccessible color contrasts, and fractured theme modes.

#### Solution:
Established the CampusConnect Design System (`design-system/campusconnect/MASTER.md`) and encoded CSS custom properties in `src/app/globals.css`:
- **Primary:** Rose Crimson (`#E11D48`) for primary actions and active states.
- **Accent:** Royal Blue (`#2563EB`) for academic contexts and verified badges.
- **Typography:** Google Fonts pairing of **Nunito** (approachable, clear headings) and **DM Sans** (highly legible interface body text).
- Defined standard surface, border, and semantic role colors (Admin: `#7C3AED`, Teacher: `#2563EB`, Student: `#059669`).

---

## 3. Verification & Results

1. **Database Schema Validation:**
   - Applied migration `20260906145538_init` to Neon Cloud PostgreSQL without schema drifts.
   - Verified 14 tables, 7 enums, and all composite unique indexes (`userId_groupId`, `userId_postId`, `userAId_userBId`).
2. **Seed Execution & Integrity Check:**
   - Ran `npx tsx prisma/seed.ts` creating 4 verified personas (`admin@campus.edu`, `teacher@campus.edu`, `alex@campus.edu`, `priya@campus.edu`), 1 academic group, and seed posts.
   - Tested password verification with `bcrypt.compare` confirming all accounts authenticate seamlessly with `Password123!`.
3. **Build & Lint Verification:**
   - Executed `npm run build` and `npm run lint` inside `code/`, confirming 0 syntax errors, valid TypeScript typings, and operational Next.js bundle compilation.
