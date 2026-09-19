import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Trail through Board → Class → Stream → Subject → Chapter → Material.
 * Wraps rather than scrolls, so the full path stays readable on a phone.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-white/55">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-brand-gold">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? 'text-white' : undefined} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last ? <ChevronRight size={14} className="shrink-0 opacity-50" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
