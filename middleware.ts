import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If we reach here, the user is authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without authentication
        if (req.nextUrl.pathname === "/login") {
          return true;
        }

        // Check if the route requires admin privileges
        const isAdminRoute =
          req.nextUrl.pathname.startsWith("/admin") ||
          req.nextUrl.pathname.startsWith("/api/admin");

        if (isAdminRoute) {
          // For admin routes, require both authentication and admin privileges
          return !!token && !!token.is_admin;
        }

        // For all other pages, require authentication only
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  },
);

// Configure which paths the middleware should run on
export const config = {
  // Protect all routes except public assets and API auth routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - manifest.json (PWA manifest file)
     * - sw.js (service worker file)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    "/((?!api/auth|_next/static|manifest\\.json|sw\\.js|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
