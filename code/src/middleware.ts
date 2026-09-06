import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Route guard middleware:
 * 1. Requires valid session/JWT for all matched dashboard routes (redirects to /login if unauthenticated).
 * 2. Enforces ADMIN role for /admin/* routes (redirects non-admin users to /feed).
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const pathname = req.nextUrl.pathname;

    // Strict role check: only ADMIN can access /admin routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/feed", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // User must be authenticated to access any matched route
        return !!token;
      },
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
    "/friends/:path*",
    "/groups/:path*",
    "/materials/:path*",
    "/schedule/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
