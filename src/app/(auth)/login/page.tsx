import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { LoginForm } from '@/app/(auth)/login/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { requireGuest } from '@/lib/auth';

export const metadata: Metadata = { title: 'Login' };

export default async function LoginPage() {
  // Signed-in users have no reason to see this page.
  await requireGuest();

  return (
    <Card className="w-full max-w-md animate-fade-up">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue studying</CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-white/75">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold text-brand-gold hover:underline">
            Sign Up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
