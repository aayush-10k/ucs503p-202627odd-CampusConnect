import { redirect } from "next/navigation";

/**
 * Root page — redirects to the social feed.
 * Once auth is wired up (Phase 3), this will check session
 * and redirect to /login if unauthenticated.
 */
export default function RootPage() {
  // Will be updated in Phase 3 to check session first
  redirect("/login");
}
