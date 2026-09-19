import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/constants';

/** The gold "BackTrack" wordmark from the prototype's `.logo`. */
export function Logo({
  href = '/',
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'text-3xl font-bold tracking-tight text-brand-gold transition-opacity hover:opacity-85',
        className
      )}
    >
      {BRAND.name}
    </Link>
  );
}
