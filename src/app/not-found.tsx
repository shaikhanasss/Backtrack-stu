import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** The prototype had no 404 route — any unknown URL rendered a blank page. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="animate-fade-up">
        <p className="text-7xl font-bold text-brand-gold">404</p>
        <h1 className="mt-4 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-2 max-w-md text-white/70">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
