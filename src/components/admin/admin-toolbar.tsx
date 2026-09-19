'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

/**
 * Search + filter + sort bar for admin lists.
 *
 * All state lives in the URL, so the server component re-runs its query and
 * there is no client-side cache to keep in sync.
 */
export function AdminToolbar({
  searchPlaceholder = 'Search...',
  filters = [],
  sorts = [],
}: {
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  sorts?: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  // Keep the box in sync when the URL changes from elsewhere (e.g. Clear).
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  function apply(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '' || value === 'all') next.delete(key);
      else next.set(key, value);
    }
    // Any change to the result set invalidates the current page number.
    if (!('page' in updates)) next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  // Debounce typing so each keystroke does not trigger a query.
  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    if (query === current) return;
    const timer = setTimeout(() => apply({ q: query || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const activeFilters = filters.filter((f) => searchParams.get(f.key));
  const hasAny = Boolean(searchParams.get('q')) || activeFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
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
          <SelectTrigger className="w-auto min-w-[150px]">
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

      {sorts.length > 0 ? (
        <Select
          value={`${searchParams.get('sort') ?? sorts[0]?.value}:${searchParams.get('dir') ?? 'asc'}`}
          onValueChange={(value) => {
            const [sort, dir] = value.split(':');
            apply({ sort, dir });
          }}
        >
          <SelectTrigger className="w-auto min-w-[170px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {sorts.flatMap((sort) => [
              <SelectItem key={`${sort.value}:asc`} value={`${sort.value}:asc`}>
                {sort.label} ↑
              </SelectItem>,
              <SelectItem key={`${sort.value}:desc`} value={`${sort.value}:desc`}>
                {sort.label} ↓
              </SelectItem>,
            ])}
          </SelectContent>
        </Select>
      ) : null}

      {hasAny ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery('');
            const next = new URLSearchParams(searchParams.toString());
            next.delete('q');
            filters.forEach((f) => next.delete(f.key));
            next.delete('page');
            startTransition(() => router.push(`${pathname}?${next.toString()}`));
          }}
        >
          <X size={14} /> Clear
        </Button>
      ) : null}
    </div>
  );
}
