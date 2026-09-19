import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Access denied' };

/**
 * 403 page.
 *
 * Shown when an authenticated user reaches a route their role does not permit.
 * This is deliberately distinct from the 404 page and from the login redirect:
 * the user is signed in and known, they simply lack the required role, and
 * saying so plainly is better than a silent bounce.
 */
export default async function UnauthorizedPage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="w-full max-w-lg animate-fade-up">
        <CardContent className="p-10 text-center">
          <ShieldAlert className="mx-auto size-14 text-brand-gold" aria-hidden="true" />

          <h1 className="mt-5 text-2xl font-bold text-white">Access denied</h1>

          <p className="mt-3 text-white/70">
            {user ? (
              <>
                You are signed in as{' '}
                <span className="font-semibold text-white">{user.email}</span> with
                the <span className="font-semibold text-brand-gold">{user.role}</span>{' '}
                role. This area requires the ADMIN role.
              </>
            ) : (
              'You do not have permission to view this page.'
            )}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={user ? '/dashboard' : '/login'}>
                {user ? 'Back to dashboard' : 'Sign in'}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
