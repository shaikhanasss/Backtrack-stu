'use server';

import { z } from 'zod';
import type { ContentStatus } from '@prisma/client';

import {
  setBoardActive, setClassActive, setStreamActive, setSubjectActive, setChapterActive,
  deleteBoard, deleteClass, deleteStream, deleteSubject, deleteChapter,
} from '@/server/actions/admin/hierarchy';
import { setNoteStatus, setPyqStatus, deleteNote, deletePyq } from '@/server/actions/admin/content';
import { setQuizStatus, deleteQuiz, deleteQuizQuestion } from '@/server/actions/admin/quiz';
import type { ActionResult } from '@/server/actions/auth-actions';

/**
 * Generic entry points for the three operations every admin list row offers.
 *
 * The alternative — an inline `'use server'` closure per row with the id baked
 * in — works, but produces one opaque action per call site, cannot be invoked
 * outside a rendered page, and quietly duplicates the same three lines across
 * eight list screens. Dispatching on a validated entity name keeps every
 * mutation a plain exported function: importable by client components,
 * callable in tests, and impossible to point at an unintended table because
 * the name is checked against a fixed enum first.
 */

const activatable = z.enum(['board', 'class', 'stream', 'subject', 'chapter']);
const publishable = z.enum(['note', 'pyq', 'quiz']);
const deletable = z.enum([
  'board', 'class', 'stream', 'subject', 'chapter', 'note', 'pyq', 'quiz', 'question',
]);

export type ActivatableEntity = z.infer<typeof activatable>;
export type PublishableEntity = z.infer<typeof publishable>;
export type DeletableEntity = z.infer<typeof deletable>;

const ACTIVE_HANDLERS = {
  board: setBoardActive,
  class: setClassActive,
  stream: setStreamActive,
  subject: setSubjectActive,
  chapter: setChapterActive,
} as const;

const STATUS_HANDLERS = {
  note: setNoteStatus,
  pyq: setPyqStatus,
  quiz: setQuizStatus,
} as const;

const DELETE_HANDLERS = {
  board: deleteBoard,
  class: deleteClass,
  stream: deleteStream,
  subject: deleteSubject,
  chapter: deleteChapter,
  note: deleteNote,
  pyq: deletePyq,
  quiz: deleteQuiz,
  question: deleteQuizQuestion,
} as const;

export async function setEntityActive(
  entity: string,
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const parsed = activatable.safeParse(entity);
  if (!parsed.success) return { ok: false, message: 'Unknown entity type.' };
  if (typeof id !== 'string' || !id) return { ok: false, message: 'Missing record id.' };
  if (typeof isActive !== 'boolean') return { ok: false, message: 'Invalid value.' };

  return ACTIVE_HANDLERS[parsed.data](id, isActive);
}

export async function setEntityStatus(
  entity: string,
  id: string,
  status: ContentStatus
): Promise<ActionResult> {
  const parsed = publishable.safeParse(entity);
  if (!parsed.success) return { ok: false, message: 'Unknown entity type.' };
  if (typeof id !== 'string' || !id) return { ok: false, message: 'Missing record id.' };

  const statusParsed = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).safeParse(status);
  if (!statusParsed.success) return { ok: false, message: 'Invalid status.' };

  return STATUS_HANDLERS[parsed.data](id, statusParsed.data);
}

export async function deleteEntity(entity: string, id: string): Promise<ActionResult> {
  const parsed = deletable.safeParse(entity);
  if (!parsed.success) return { ok: false, message: 'Unknown entity type.' };
  if (typeof id !== 'string' || !id) return { ok: false, message: 'Missing record id.' };

  return DELETE_HANDLERS[parsed.data](id);
}
