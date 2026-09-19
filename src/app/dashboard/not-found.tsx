import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * 404 inside the student area.
 *
 * A segment-level not-found keeps the dashboard shell (header and nav) around
 * the message, so a bad link does not throw the student out of the app.
 */
export default function DashboardNotFound() {
  return (
    <div className="glass mx-auto max-w-lg rounded-card p-10 text-center">
      <SearchX className="mx-auto size-12 text-brand-gold" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold text-white">Not found</h1>
      <p className="mt-2 text-sm text-white/70">
        This material, subject or quiz does not exist, is no longer published, or
        belongs to another account.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard/notes">Browse study material</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
