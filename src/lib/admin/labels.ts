import type { FormOptions } from '@/server/admin-queries';

/**
 * Human labels for the admin pickers and filters.
 *
 * These live in a plain module, NOT alongside the forms: the forms are
 * `'use client'`, and a function exported from a client module cannot be
 * *called* by a Server Component — React throws "Attempted to call
 * subjectLabel() from the server". Both server pages and client forms need
 * these strings, so they belong in shared, environment-neutral code.
 */

/** "SSC · Class 10 · Mathematics" */
export function subjectLabel(
  subject: FormOptions['subjects'][number],
  options: FormOptions
) {
  const board = options.boards.find((b) => b.id === subject.class.boardId);
  return `${board?.name ?? '?'} · ${subject.class.name} · ${subject.name}`;
}

/** "SSC · Class 10 · Mathematics · 2. Quadratic Equations" */
export function chapterLabel(
  chapter: FormOptions['chapters'][number],
  options: FormOptions
) {
  const subject = options.subjects.find((s) => s.id === chapter.subjectId);
  const board = options.boards.find((b) => b.id === subject?.class.boardId);
  return `${board?.name ?? '?'} · ${subject?.class.name ?? '?'} · ${subject?.name ?? '?'} · ${chapter.number}. ${chapter.title}`;
}
