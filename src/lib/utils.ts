import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turns "Linear Equations in Two Variables" into "linear-equations-in-two-variables". */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Formats a date for display.
 *
 * The timezone is pinned rather than left to the runtime: without it the server
 * formats in the host's timezone and the browser re-formats in the visitor's,
 * which produces a different string for the same instant and a React hydration
 * mismatch. IST is correct for this application's audience.
 */
export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(date));
}

/** Percentage helper that never divides by zero. */
export function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
