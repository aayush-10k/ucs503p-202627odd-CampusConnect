# Week 1 : Core Architecture, NextAuth RBAC & Cloud Storage Integration

**Author:** Divyansh Jasrotia (Roll No. 1024240008)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 2 — Core Library Setup & Authentication Subsystem  

---

## 1. Overview of Assigned Tasks

During this phase, I was responsible for implementing the foundational backend architecture and utility singletons required across the entire CampusConnect platform:
1. **Task 2.1 — Prisma Client Singleton (`src/lib/prisma.ts`)**: Global database client management with connection pooling to prevent pool exhaustion in Next.js development.
2. **Task 2.2 — NextAuth Configuration (`src/lib/auth.ts`)**: Role-Based Access Control (RBAC) authentication engine using Credentials Provider, bcrypt password verification, and suspended account blocking.
3. **Task 2.3 — TypeScript Type Extensions (`src/types/next-auth.d.ts`)**: Declaration merging to strongly type NextAuth sessions and JWT tokens with user `id`, `role` (`ADMIN`, `TEACHER`, `STUDENT`), `department`, and `batch`.
4. **Task 2.4 — Cloudinary Media Helper (`src/lib/cloudinary.ts`)**: Multi-format media upload service handling `File`, `Blob`, Node.js `Buffer`, and Base64 data URIs for profile avatars, post images, and course PDFs.

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: Next.js Hot Reloading & Prisma Client Connection Pool Exhaustion

#### Error Encountered:
During rapid iteration in Next.js App Router development mode (`next dev`), module reloading re-evaluated the Prisma client instantiation, spawning new database connections on every edit:
```
Error: Can't reach database server at `ep-rapid-pool.ap-southeast-1.aws.neon.tech:5432`
PrismaClientInitializationError: Connection pool limit exceeded.
```

#### Key Observation:
In development, Node.js clears the `require`/`import` cache on hot reload, creating fresh instances of `PrismaClient`. Since serverless PostgreSQL (Neon) has finite connection pool limits, persistent connections from previous reloads stayed open until timeout.

#### Solution:
Attached the `PrismaClient` instance to the `globalThis` object in development to ensure a strict singleton pattern:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

### Issue B: TypeScript Type Incompatibility in NextAuth RBAC Callbacks

#### Error Encountered:
By default, NextAuth's `Session` and `JWT` types only permit generic fields (`name`, `email`, `image`). When attempting to attach institutional role and department metadata from Prisma in `jwt()` and `session()` callbacks:
```
Property 'role' does not exist on type 'User'.
Type '{ name: string; email: string; role: Role; }' is not assignable to type 'Session'.
```

#### Key Observation:
NextAuth relies on TypeScript module declaration merging. Without explicit ambient interface extensions, TypeScript rejects custom properties during compilation, breaking strict typing in protected routes and middleware.

#### Solution:
Authored [`src/types/next-auth.d.ts`](../../code/src/types/next-auth.d.ts) to augment `next-auth` and `next-auth/jwt`:
```typescript
import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    department?: string | null;
    batch?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string | null;
      batch?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    department?: string | null;
    batch?: string | null;
  }
}
```
This enabled seamless propagation in `src/lib/auth.ts`:
```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.department = user.department;
      token.batch = user.batch;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.department = token.department;
      session.user.batch = token.batch;
    }
    return session;
  },
}
```

---

### Issue C: Multi-Payload Media Upload Support in Cloudinary Helper

#### Problem:
Next.js handles file uploads differently across boundaries: Web standard `File`/`Blob` objects from `FormData`, Node.js `Buffer` objects in backend route handlers, and Base64 strings from client-side profile photo croppers. A rigid upload function resulted in type errors and payload serialization issues.

#### Solution:
Engineered `uploadFile()` in `src/lib/cloudinary.ts` to normalize all incoming data representations into a standard stream:
```typescript
export async function uploadFile(
  file: File | Blob | Buffer | ArrayBuffer | string,
  options?: UploadOptions
): Promise<UploadResult> {
  // Normalize File/Blob/ArrayBuffer into Node Buffer
  let buffer: Buffer;
  if (typeof file === "string") {
    // Direct URL or Base64 data URI
    return uploadDirect(file, options);
  } else if (Buffer.isBuffer(file)) {
    buffer = file;
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file);
  } else if ("arrayBuffer" in file && typeof file.arrayBuffer === "function") {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }
  // Upload buffer via Cloudinary upload_stream
  return uploadFromBuffer(buffer, options);
}
```

---

## 3. Verification & Results

To ensure stability before proceeding to Phase 3, I authored and executed comprehensive end-to-end verification scripts (`scripts/verify-all.ts` and `scripts/verify-phase2-tasks.ts`):

1. **Database & Connection Pooling:**
   - Successfully verified connection to Neon PostgreSQL instance.
   - Performed sample queries on `User` and `Group` models with sub-50ms latency.
2. **NextAuth Credentials & RBAC:**
   - Validated bcrypt password hashing and comparison (`Password123!`).
   - Verified account suspension flag enforcement (`isSuspended: true` rejects sign-in).
   - Confirmed JWT and Session object role injection (`ADMIN`, `TEACHER`, `STUDENT`).
3. **Cloudinary Asset Pipeline:**
   - Executed synthetic upload of test image payload to `campus_connect/test` folder.
   - Successfully verified Cloudinary CDN URL generation with HTTPS delivery.
   - Cleaned up test artifacts via Cloudinary Admin SDK (`destroy` API).

All deliverables for Tasks 2.1 through 2.4 passed all test gates with zero TypeScript compiler errors.
