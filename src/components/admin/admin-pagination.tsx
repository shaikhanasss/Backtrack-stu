'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PAGE_SIZES } from '@/lib/admin/query-params';

export function AdminPagination({
  page,
  pageCount,
  pageSize,
  total,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/65">
      <span>
        {total === 0 ? 'No results' : `Showing ${first}–${last} of ${total}`}
      </span>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => go({ pageSize: value, page: '1' })}
          >
            <SelectTrigger className="h-9 w-[84px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => go({ page: String(page - 1) })}
          >
            <ChevronLeft size={14} /> Prev
          </Button>
          <span className="tabular-nums">
            {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => go({ page: String(page + 1) })}
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
