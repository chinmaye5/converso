import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — accessible without authentication.
const isPublicRoute = createRouteMatcher([
  "/",
  "/chat/(.*)",    // public customer chat
  "/login(.*)",
  "/signup(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect every route that is NOT public.
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Match everything except Next.js internal routes and static files.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

