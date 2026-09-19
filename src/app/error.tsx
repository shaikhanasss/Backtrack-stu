'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[BackTrack] Unhandled error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="glass max-w-md rounded-card p-10">
        <p className="text-5xl" aria-hidden="true">
          ⚠️
        </p>
        <h1 className="mt-4 text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-white/70">
          An unexpected error occurred. Try again, and if it keeps happening
          check the server logs.
        </p>
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </main>
  );
}
