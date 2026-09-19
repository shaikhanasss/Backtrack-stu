'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import {
  profileSchema,
  changePasswordSchema,
} from '@/lib/validators/profile';
import type { ActionResult } from '@/server/actions/auth-actions';

/**
 * Updates the signed-in student's profile.
 *
 * The academic fields are re-checked against the database, not just the Zod
 * schema: a crafted request could otherwise attach a class from a different
 * board, or give an SSC student a stream. Because SSC simply has no Stream
 * rows, the "stream must belong to the selected board" check enforces the
 * SSC/HSC rule from the data rather than from a hardcoded board name.
 */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, image, boardId, classId, streamId } = parsed.data;

  if (boardId) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true },
    });
    if (!board) {
      return {
        ok: false,
        message: 'That board no longer exists.',
        fieldErrors: { boardId: ['Unknown board'] },
      };
    }
  }

  if (classId) {
    const klass = await prisma.class.findUnique({
      where: { id: classId },
      select: { boardId: true },
    });
    if (!klass || klass.boardId !== boardId) {
      return {
        ok: false,
        message: 'That class does not belong to the selected board.',
        fieldErrors: { classId: ['Invalid class for this board'] },
      };
    }
  }

  if (streamId) {
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { boardId: true },
    });
    if (!stream || stream.boardId !== boardId) {
      return {
        ok: false,
        message:
          'That stream does not belong to the selected board. SSC has no streams.',
        fieldErrors: { streamId: ['Invalid stream for this board'] },
      };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, image, boardId, classId, streamId },
  });

  // The header and dashboard read the user row directly, so refreshing these
  // paths is enough — there is no stale JWT copy of the name to reconcile.
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');

  return { ok: true };
}

/**
 * Changes the signed-in user's password.
 *
 * Requires the current password even though the user is already authenticated,
 * so a hijacked session cannot lock the real owner out.
 */
export async function changePassword(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  // OAuth-only accounts have no password to change.
  if (!record?.passwordHash) {
    return {
      ok: false,
      message:
        'This account signs in with Google and has no password set.',
    };
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
  if (!matches) {
    return {
      ok: false,
      message: 'Your current password is incorrect.',
      fieldErrors: { currentPassword: ['Incorrect password'] },
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });

  return { ok: true };
}
