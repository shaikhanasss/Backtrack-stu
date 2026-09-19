import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Port of the prototype's `Card.jsx`.
 *
 * The original rendered its link only when both `to` and `actionLabel` were
 * passed — and no caller ever passed them, so every card was inert. Here the
 * whole card is the link when `href` is given, so cards actually navigate.
 */
export interface FeatureCardProps {
  icon: string;
  title: string;
  description?: string | null;
  href?: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  href,
  className,
}: FeatureCardProps) {
  const body = (
    <div
      className={cn(
        'glass-strong card-hover flex h-full w-full flex-col items-center rounded-card p-8 text-center',
        className
      )}
    >
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-white/75">{description}</p>
      ) : null}
      {href ? (
        <span className="mt-4 text-sm font-bold text-brand-gold">Open →</span>
      ) : null}
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block h-full focus-visible:rounded-card">
      {body}
    </Link>
  );
}
