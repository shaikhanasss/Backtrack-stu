import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoading() {
  return (
    <div className="glass w-full max-w-md rounded-card p-10">
      <Skeleton className="mx-auto h-8 w-48" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-12 w-full rounded-pill" />
        <Skeleton className="h-12 w-full rounded-pill" />
        <Skeleton className="h-11 w-full rounded-pill" />
      </div>
    </div>
  );
}
