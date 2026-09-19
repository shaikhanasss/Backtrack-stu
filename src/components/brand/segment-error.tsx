'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Shared body for segment-level error boundaries, so the dashboard and admin
 * areas fail the same way instead of each inventing their own treatment.
 */
export function SegmentError({
  error,
  reset,
  area,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  area: string;
}) {
  useEffect(() => {
    console.error(`[BackTrack] ${area} error:`, error);
  }, [error, area]);

  return (
    <div className="glass mx-auto max-w-lg rounded-card p-10 text-center">
      <AlertTriangle className="mx-auto size-12 text-brand-gold" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-bold text-white">
        Could not load the {area}
      </h2>
      <p className="mt-2 text-sm text-white/70">
        Something went wrong while fetching data. Try again — if it keeps
        happening, check that PostgreSQL is running.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-white/40">Ref: {error.digest}</p>
      ) : null}
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
