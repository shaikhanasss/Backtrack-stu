'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export interface StudentFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

/**
 * Search and filters for the student listing pages.
 *
 * State lives in the URL so a filtered view can be shared or bookmarked, and so
 * the server component re-queries rather than filtering an already-fetched list
 * on the client.
 */
export function StudentFilterBar({
  searchPlaceholder = 'Search...',
  filters = [],
}: {
  searchPlaceholder?: string;
  filters?: StudentFilter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  function apply(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all') next.delete(key);
      else next.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    if (query === current) return;
    const timer = setTimeout(() => apply({ q: query || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasAny =
    Boolean(searchParams.get('q')) || filters.some((f) => searchParams.get(f.key));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-11"
          aria-label={searchPlaceholder}
        />
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={searchParams.get(filter.key) ?? 'all'}
          onValueChange={(value) => apply({ [filter.key]: value })}
        >
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasAny ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery('');
            startTransition(() => router.push(pathname));
          }}
        >
          <X size={14} /> Clear
        </Button>
      ) : null}
    </div>
  );
}
