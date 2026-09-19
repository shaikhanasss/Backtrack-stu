import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

/**
 * Route protection.
 *
 * This is a UX layer only — it redirects unauthenticated visitors to /login and
 * non-admins away from /admin. It is NOT the security boundary: every protected
 * layout and Server Action re-checks the session and role against the database,
 * because middleware can be bypassed by invoking a Server Action directly.
 *
 * It runs on the Edge runtime, so it reads the role from the JWT rather than
 * querying Postgres (Prisma cannot run here).
 */
const { auth } = NextAuth(authConfig);

const STUDENT_PREFIX = '/dashboard';
const ADMIN_PREFIX = '/admin';
const AUTH_PAGES = ['/login', '/signup'];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = Boolean(session?.user);
  const { pathname } = nextUrl;

  // Signed-in users have no reason to see the login or signup screens.
  if (isLoggedIn && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(STUDENT_PREFIX, nextUrl));
  }

  const needsStudent = pathname.startsWith(STUDENT_PREFIX);
  const needsAdmin = pathname.startsWith(ADMIN_PREFIX);

  if ((needsStudent || needsAdmin) && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    // Send the user back where they were headed after a successful login.
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but wrong role: this is a 403, not a missing login.
  if (needsAdmin && session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Skip static assets and the auth API routes.
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
