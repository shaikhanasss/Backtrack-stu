/**
 * Shared parsing for the list-screen URL parameters (search, filters, sort,
 * pagination). Keeping state in the URL means every admin list is bookmarkable,
 * shareable and survives a refresh — and it needs no client state at all.
 */

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export type SortDirection = 'asc' | 'desc';

export interface ListParams {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  dir: SortDirection;
  filters: Record<string, string>;
}

export function parseListParams(
  searchParams: Record<string, string | string[] | undefined>,
  options: {
    defaultSort: string;
    defaultDir?: SortDirection;
    allowedSorts: readonly string[];
    filterKeys?: readonly string[];
  }
): ListParams {
  const one = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const rawPage = Number.parseInt(one('page') ?? '1', 10);
  const rawSize = Number.parseInt(one('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10);
  const sort = one('sort') ?? options.defaultSort;
  const dirRaw = one('dir');
  const dir: SortDirection =
    dirRaw === 'desc' ? 'desc' : dirRaw === 'asc' ? 'asc' : (options.defaultDir ?? 'asc');

  const filters: Record<string, string> = {};
  for (const key of options.filterKeys ?? []) {
    const value = one(key);
    if (value && value !== 'all') filters[key] = value;
  }

  return {
    q: (one('q') ?? '').trim().slice(0, 100),
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(rawSize) ? rawSize : DEFAULT_PAGE_SIZE,
    // Never interpolate an unvalidated column name into an orderBy.
    sort: options.allowedSorts.includes(sort) ? sort : options.defaultSort,
    dir,
    filters,
  };
}

/** Builds an orderBy for a possibly nested sort key such as "class.level". */
export function buildOrderBy(sort: string, dir: SortDirection): Record<string, unknown> {
  const parts = sort.split('.');
  let result: Record<string, unknown> = { [parts[parts.length - 1]]: dir };
  for (let i = parts.length - 2; i >= 0; i -= 1) {
    result = { [parts[i]]: result };
  }
  return result;
}

export interface Paged<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function paginate<T>(rows: T[], total: number, params: ListParams): Paged<T> {
  return {
    rows,
    total,
    page: params.page,
    pageSize: params.pageSize,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}
