import { cn } from '@/lib/utils';

/** Port of the prototype's `.stat` box, now fed by real query results. */
export function StatCard({
  value,
  label,
  className,
}: {
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'glass rounded-card p-6 text-center transition-all duration-300 hover:scale-105 hover:bg-white/20',
        className
      )}
    >
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/70">{label}</div>
    </div>
  );
}
