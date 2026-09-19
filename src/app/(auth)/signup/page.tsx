import type { Metadata } from 'next';
import Link from 'next/link';

import { SignupForm } from '@/app/(auth)/signup/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { requireGuest } from '@/lib/auth';

export const metadata: Metadata = { title: 'Create Account' };

export default async function SignupPage() {
  // Signed-in users have no reason to see this page.
  await requireGuest();

  return (
    <Card className="w-full max-w-md animate-fade-up">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Start tracking your study progress</CardDescription>
      </CardHeader>

      <CardContent>
        <SignupForm />

        <p className="mt-6 text-center text-sm text-white/75">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-brand-gold hover:underline">
            Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
