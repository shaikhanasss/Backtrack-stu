import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { requireAdmin } from '@/lib/auth';
import type { ActionResult } from '@/server/actions/auth-actions';

/**
 * Common wrapper for every admin mutation.
 *
 * Guarantees three things at one place rather than in twenty action bodies:
 *   1. the caller is an admin, re-checked against the database;
 *   2. the input passes its Zod schema on the server, whatever the client did;
 *   3. Prisma constraint violations become readable field errors instead of
 *      leaking a raw database message to the UI.
 */
export async function adminMutation<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
  run: (data: z.output<TSchema>) => Promise<void>,
  options: { revalidate?: string[]; uniqueMessage?: Record<string, string> } = {}
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await run(parsed.data);
  } catch (error) {
    return mapPrismaError(error, options.uniqueMessage);
  }

  for (const path of options.revalidate ?? []) revalidatePath(path);
  return { ok: true };
}

/** Same guarantees for operations that take no validated payload. */
export async function adminOperation(
  run: () => Promise<void>,
  options: { revalidate?: string[]; uniqueMessage?: Record<string, string> } = {}
): Promise<ActionResult> {
  await requireAdmin();

  try {
    await run();
  } catch (error) {
    return mapPrismaError(error, options.uniqueMessage);
  }

  for (const path of options.revalidate ?? []) revalidatePath(path);
  return { ok: true };
}

function mapPrismaError(
  error: unknown,
  uniqueMessage?: Record<string, string>
): ActionResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique violation. `target` names the offending column(s).
        const target = Array.isArray(error.meta?.target)
          ? (error.meta.target as string[])
          : typeof error.meta?.target === 'string'
            ? [error.meta.target as string]
            : [];
        const field = target.find((t) => uniqueMessage?.[t]) ?? target[0];
        const message =
          (field && uniqueMessage?.[field]) ??
          'That value is already taken. Try a different name or slug.';
        return {
          ok: false,
          message,
          fieldErrors: field ? { [field]: [message] } : undefined,
        };
      }
      case 'P2003':
        return {
          ok: false,
          message: 'That record is still referenced by other content and cannot be changed.',
        };
      case 'P2025':
        return { ok: false, message: 'That record no longer exists. Refresh and try again.' };
      default:
        break;
    }
  }

  // Malformed arguments reaching Prisma mean the caller sent a shape the UI
  // never produces. Treat it as a bad request rather than an internal fault, so
  // it does not masquerade as a server bug in the logs.
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { ok: false, message: 'That request was not valid. Refresh and try again.' };
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    // Our hand-written CHECK constraints surface here.
    const text = error.message;
    if (text.includes('subjects_code_key_not_null')) {
      return {
        ok: false,
        message: 'That subject code is already in use.',
        fieldErrors: { code: ['Code already in use'] },
      };
    }
    if (text.includes('quiz_questions_correct_index_in_range')) {
      return { ok: false, message: 'The correct answer must be one of the four options.' };
    }
  }

  // Anything genuinely unexpected should still reach the server logs.
  console.error('[BackTrack] admin mutation failed:', error);
  return { ok: false, message: 'Something went wrong. Check the server logs.' };
}

/** Paths that must be refreshed after content changes. */
export const ADMIN_PATHS = {
  dashboard: '/admin',
  boards: '/admin/boards',
  classes: '/admin/classes',
  streams: '/admin/streams',
  subjects: '/admin/subjects',
  chapters: '/admin/chapters',
  notes: '/admin/notes',
  pyqs: '/admin/pyqs',
  quizzes: '/admin/quizzes',
} as const;
