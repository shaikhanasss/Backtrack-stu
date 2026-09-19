import type { Role } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

/**
 * Adds `id` and `role` to the session so server components and route guards can
 * authorise without an extra database round-trip.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    role?: Role;
  }
}

/**
 * In Auth.js v5 the JWT type is owned by `@auth/core/jwt`; `next-auth/jwt`
 * only re-exports it. Both are augmented so the token is typed no matter which
 * path a file imports from.
 */
declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
  }
}

export {};
