# Week 1 : AI Moderation Pipeline, Real-Time Client & Edge Route Guard

**Author:** Prakhar Saxena (Roll No. 1024240019)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 2 — Core Library Setup (AI Engine, WebSocket Client, Route Security)  

---

## 1. Overview of Assigned Tasks

During Phase 2 of CampusConnect, I was responsible for implementing the AI-powered content safety subsystem, real-time communication scaffolding, shared frontend utilities, and edge-level route authorization:
1. **Task 2.5 — Gemini AI Content Moderation Helper (`src/lib/gemini.ts`)**: Built an intelligent policy moderation function using the Google Gemini API (`gemini-2.5-flash`) that scans student and teacher posts against campus conduct standards with configurable sensitivity levels (Strict, Moderate, Lenient).
2. **Task 2.6 — Utility Functions (`src/lib/utils.ts`)**: Developed shared UI and string utilities, including the foundational `cn()` helper (combining `clsx` and `tailwind-merge`) to safely resolve Tailwind CSS class collisions, as well as `formatDate()`, `timeAgo()`, `truncate()`, and `getInitials()`.
3. **Task 2.7 — Socket.io Client Helper (`src/lib/socket.ts`)**: Implemented a browser-safe, lazy-initialized Socket.io client singleton to support live notifications and 1-on-1 direct messaging without opening duplicate WebSocket handshakes on component re-renders.
4. **Task 2.8 — Route Guard Middleware (`src/middleware.ts`)**: Configured Next.js Edge Middleware using NextAuth's `withAuth` to enforce authentication across all dashboard routes and restrict `/admin/*` views exclusively to `Role.ADMIN`.

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: Gemini AI Output Parsing & Resilient Error Handling

#### Problem:
When calling the Gemini generative model to moderate user posts, LLMs frequently format their structured responses within markdown code fences (e.g., ````json { "flagged": true, "reason": "..." } ````) or append conversational preamble. Attempting a direct `JSON.parse(responseText)` threw syntax errors:
```
SyntaxError: Unexpected token '`', "```json
{"... is not valid JSON
```
Additionally, if network connectivity to Google AI Studio fails or the API key is not configured in local development, post creation could be completely blocked.

#### Key Observation:
The moderation pipeline must be non-blocking and resilient: it should extract the exact JSON object using pattern matching, and in the event of an upstream API outage or missing credentials, it should fail open with a descriptive warning rather than crash the user experience.

#### Solution:
Engineered `moderateContent()` in `src/lib/gemini.ts` with regex JSON extraction, strict system instruction prompts, and a graceful fallback:
```typescript
import { GoogleGenAI } from "@google/genai";

export type ModerationSensitivity = "STRICT" | "MODERATE" | "LENIENT";

export async function moderateContent(
  text: string,
  sensitivity: ModerationSensitivity = "MODERATE"
): Promise<{ flagged: boolean; reason: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Skipping AI moderation.");
    return { flagged: false, reason: "" };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an automated content moderation agent for CampusConnect...
Sensitivity: ${sensitivity}
Text to evaluate: """${text}"""
Respond ONLY with a JSON object in this exact format:
{"flagged": true/false, "reason": "concise explanation if flagged, empty if not"}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text?.trim() || "";
    // Robust JSON extraction matching '{ ... }'
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        flagged: Boolean(parsed.flagged),
        reason: typeof parsed.reason === "string" ? parsed.reason : "",
      };
    }
    return { flagged: false, reason: "" };
  } catch (error) {
    console.error("Gemini AI moderation error:", error);
    // Fail open so platform remains operational during transient API outages
    return { flagged: false, reason: "" };
  }
}
```

---

### Issue B: Next.js Edge Runtime Constraints in Route Protection

#### Problem:
Next.js route middleware executes on the lightweight V8 Edge Runtime. The Edge runtime does not include Node.js core modules (`crypto`, `stream`, `fs`) and cannot establish direct TCP database connections through Prisma ORM. When trying to perform database-level role lookups inside `middleware.ts`:
```
Error: A Node.js API is used which is not supported in the Edge Runtime: crypto
```

#### Key Observation:
Authentication and role verification in middleware must rely entirely on cryptographic JWT session claims already verified by NextAuth, requiring zero database queries on incoming HTTP requests.

#### Solution:
Configured `src/middleware.ts` with `withAuth` to extract user permissions directly from the encrypted JWT token at the edge:
```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Guard 1: Protect Admin endpoints - require ADMIN role
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/feed", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true if token exists (user is authenticated)
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/feed/:path*",
    "/profile/:path*",
    "/groups/:path*",
    "/schedule/:path*",
    "/messages/:path*",
    "/admin/:path*",
  ],
};
```

---

### Issue C: Tailwind CSS Class Specificity Conflicts & `cn()` Utility

#### Problem:
When building reusable UI primitives (e.g. `Button`, `Card`, `Badge`), passing conditional utility classes (such as `px-4 py-2` combined with a prop `px-6`) via string concatenation `className={`${defaultClasses} ${customClasses}`}` resulted in conflicting classes. In Tailwind CSS, specificity is determined by the stylesheet order rather than argument order, often rendering incorrect padding or background colors.

#### Solution:
Implemented the canonical `cn()` helper in `src/lib/utils.ts` combining `clsx` (for conditional boolean maps) and `tailwind-merge` (for intelligent specificity resolution):
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

---

## 3. Verification & Results

1. **Gemini AI Moderation Verification:**
   - Executed test scans against clean academic posts (`"Sharing the lecture notes for Computer Networks Chapter 4"`): Returned `flagged: false`.
   - Executed test scans against toxic and abusive content: Correctly returned `flagged: true` with a detailed policy rationale.
2. **Edge Route Guard Verification:**
   - Attempted unauthenticated navigation to `/feed` and `/admin`: Automatically redirected to `/login`.
   - Authenticated as `Role.STUDENT` and navigated to `/admin`: Correctly blocked and redirected to `/feed`.
   - Authenticated as `Role.ADMIN`: Seamlessly permitted access to `/admin` dashboard routes.
3. **Socket.io Singleton & Utilities:**
   - Verified that `getSocket()` returns the identical socket instance across consecutive calls in the browser environment.
   - Tested `cn()` resolving class overrides (`p-2` overridden by `p-4`) properly.
   - Verified live operational health via `scripts/verify-all.ts`.
