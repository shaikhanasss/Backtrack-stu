import { cache } from 'react';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';
import { loginSchema } from '@/lib/validators/auth';

/**
 * Full Auth.js setup (Node runtime).
 *
 * This replaces the prototype's `AuthContext`, which was a `useState(false)`
 * boolean that accepted any email and password and reset on page refresh.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        // No account, or an OAuth-only account with no password set.
        if (!user?.passwordHash) return null;
        if (!user.isActive) return null;

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});

// ---------------------------------------------------------------------------
// Reusable authentication utilities
// ---------------------------------------------------------------------------

/**
 * The signed-in user, loaded fresh from the database.
 *
 * The JWT only carries `id` and `role`. Reading the row instead of trusting the
 * token means a renamed profile or a revoked admin role takes effect on the very
 * next request, rather than persisting until the token expires.
 *
 * `cache()` deduplicates this within a single request, so a page that calls it
 * from both the layout and the page body still issues one query.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { board: true, class: true, stream: true },
  });

  // Deactivated between requests, or the row was deleted while a token lived on.
  if (!user || !user.isActive) return null;

  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** True when someone is signed in. */
export async function isAuthenticated() {
  return (await getCurrentUser()) !== null;
}

/** True when the signed-in user is an admin. */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN';
}

/**
 * Requires a signed-in user, or redirects to the login page.
 * `callbackUrl` returns the user to where they were headed after signing in.
 */
export async function requireUser(callbackUrl?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const target = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login';
    redirect(target);
  }
  return user;
}

/**
 * Requires an admin.
 *
 * An unauthenticated visitor is sent to sign in; an authenticated non-admin is
 * sent to /unauthorized. The distinction matters: the second case is not a
 * missing login, and bouncing them to a login form they have already completed
 * would be confusing.
 */
export async function requireAdmin(callbackUrl?: string) {
  const user = await requireUser(callbackUrl);
  if (user.role !== 'ADMIN') redirect('/unauthorized');
  return user;
}

/** Requires that nobody is signed in — used by the login and signup pages. */
export async function requireGuest(redirectTo = '/dashboard') {
  if (await isAuthenticated()) redirect(redirectTo);
}
