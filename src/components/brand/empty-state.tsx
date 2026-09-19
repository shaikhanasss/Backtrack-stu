import { cn } from '@/lib/utils';

/**
 * Shown wherever the database legitimately has no rows yet. Used instead of
 * inventing placeholder content, so the UI never implies data that isn't there.
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  className,
}: {
  icon?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('glass rounded-card p-10 text-center', className)}>
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-white/65">{description}</p>
      ) : null}
    </div>
  );
}
