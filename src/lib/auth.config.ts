import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Edge-safe half of the Auth.js configuration.
 *
 * `middleware.ts` runs on the Edge runtime, where Prisma and bcrypt cannot run.
 * Everything that needs Node (the Prisma adapter and the Credentials provider)
 * lives in `auth.ts` instead, and this file holds what both share.
 */
const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const authConfig = {
  // The Credentials provider requires JWT sessions — database sessions are not
  // supported for it by Auth.js.
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: googleEnabled
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : [],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on the initial sign-in.
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'STUDENT';
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
