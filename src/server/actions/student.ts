'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { touchStreak } from '@/lib/streak';
import { scoreAnswers } from '@/lib/quiz-scoring';
import type { ActionResult } from '@/server/actions/auth-actions';

/**
 * Every export of a 'use server' module is a public HTTP endpoint, so an id
 * arriving here is untrusted input, not a value the UI guarantees. Passing a
 * non-string straight into Prisma throws out of the action instead of
 * returning a result, which surfaces as a 500 rather than a handled error.
 */
function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Student-side mutations.
 *
 * Every one re-checks the session server-side and scopes its writes to the
 * caller's own id, so a crafted request cannot record progress or bookmarks
 * against another student's account.
 */

/**
 * Records that the student opened a note.
 *
 * Uses an upsert keyed on the [userId, noteId] compound unique so repeat visits
 * update `lastReadAt` instead of creating duplicate rows. A note already marked
 * COMPLETED stays completed — re-reading it is not a regression.
 */
export async function recordNoteView(noteId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(noteId)) return { ok: false, message: 'Missing material id.' };

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, status: true },
  });
  if (!note || note.status !== 'PUBLISHED') {
    return { ok: false, message: 'That material is not available.' };
  }

  await prisma.$transaction([
    prisma.noteProgress.upsert({
      where: { userId_noteId: { userId: user.id, noteId } },
      create: { userId: user.id, noteId, status: 'IN_PROGRESS' },
      update: { lastReadAt: new Date() },
    }),
    prisma.note.update({
      where: { id: noteId },
      data: { viewCount: { increment: 1 } },
    }),
  ]);

  await touchStreak(user.id);

  return { ok: true };
}

export async function setNoteCompleted(
  noteId: string,
  completed: boolean
): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(noteId)) return { ok: false, message: 'Missing material id.' };
  if (typeof completed !== 'boolean') return { ok: false, message: 'Invalid value.' };

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, status: true },
  });
  if (!note || note.status !== 'PUBLISHED') {
    return { ok: false, message: 'That material is not available.' };
  }

  const status = completed ? 'COMPLETED' : 'IN_PROGRESS';

  await prisma.noteProgress.upsert({
    where: { userId_noteId: { userId: user.id, noteId } },
    create: {
      userId: user.id,
      noteId,
      status,
      completedAt: completed ? new Date() : null,
    },
    update: { status, completedAt: completed ? new Date() : null },
  });

  await touchStreak(user.id);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/progress');
  revalidatePath(`/dashboard/material/${noteId}`);

  return { ok: true };
}

const bookmarkTarget = z
  .object({
    noteId: z.string().min(1).nullable().default(null),
    pyqId: z.string().min(1).nullable().default(null),
  })
  // The database enforces this too (CHECK num_nonnulls = 1); rejecting it here
  // gives the user a readable message instead of a constraint error.
  .refine((data) => Boolean(data.noteId) !== Boolean(data.pyqId), {
    message: 'Bookmark exactly one item.',
  });

/** Adds or removes a bookmark, returning the resulting state. */
export async function toggleBookmark(
  input: unknown
): Promise<ActionResult & { bookmarked?: boolean }> {
  const user = await requireUser();

  const parsed = bookmarkTarget.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid bookmark target.' };
  }

  const { noteId, pyqId } = parsed.data;

  const existing = await prisma.bookmark.findFirst({
    where: {
      userId: user.id,
      ...(noteId ? { noteId } : { pyqId }),
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    revalidatePath('/dashboard/bookmarks');
    return { ok: true, bookmarked: false };
  }

  await prisma.bookmark.create({
    data: { userId: user.id, noteId, pyqId },
  });

  revalidatePath('/dashboard/bookmarks');
  return { ok: true, bookmarked: true };
}

/**
 * Starts (or resumes) an attempt.
 *
 * An unfinished attempt is reused rather than starting a new one, so a refresh
 * mid-quiz does not silently abandon the student's answers.
 */
export async function startQuizAttempt(
  quizId: string
): Promise<ActionResult & { attemptId?: string }> {
  const user = await requireUser();
  if (!isId(quizId)) return { ok: false, message: 'Missing quiz id.' };

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, status: true, _count: { select: { questions: true } } },
  });

  if (!quiz || quiz.status !== 'PUBLISHED') {
    return { ok: false, message: 'That quiz is not available.' };
  }
  if (quiz._count.questions === 0) {
    return { ok: false, message: 'That quiz has no questions yet.' };
  }

  const open = await prisma.quizAttempt.findFirst({
    where: { userId: user.id, quizId, completedAt: null },
    orderBy: { startedAt: 'desc' },
    select: { id: true },
  });

  if (open) return { ok: true, attemptId: open.id };

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      quizId,
      totalQuestions: quiz._count.questions,
      answers: {},
    },
    select: { id: true },
  });

  return { ok: true, attemptId: attempt.id };
}

const answersSchema = z.record(z.string(), z.number().int().min(0).max(3));

/**
 * Scores and closes an attempt.
 *
 * Grading happens here, never on the client: the correct answers are read from
 * the database at submit time, so the browser is never told which option is
 * right until the attempt is over.
 */
export async function submitQuizAttempt(
  attemptId: string,
  rawAnswers: unknown
): Promise<ActionResult & { score?: number; total?: number }> {
  const user = await requireUser();
  if (!isId(attemptId)) return { ok: false, message: 'Missing attempt id.' };

  const parsed = answersSchema.safeParse(rawAnswers);
  if (!parsed.success) {
    return { ok: false, message: 'Those answers could not be read.' };
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      completedAt: true,
      startedAt: true,
      quiz: {
        select: {
          id: true,
          questions: { select: { id: true, correctIndex: true, marks: true } },
        },
      },
    },
  });

  if (!attempt) return { ok: false, message: 'That attempt no longer exists.' };
  // Scoping to the caller stops one student submitting into another's attempt.
  if (attempt.userId !== user.id) {
    return { ok: false, message: 'That attempt belongs to another account.' };
  }
  if (attempt.completedAt) {
    return { ok: false, message: 'This attempt has already been submitted.' };
  }

  const { score, totalMarks, cleanedAnswers } = scoreAnswers(
    attempt.quiz.questions,
    parsed.data
  );

  const now = new Date();

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      answers: cleanedAnswers,
      score,
      totalQuestions: attempt.quiz.questions.length,
      completedAt: now,
      timeTakenSec: Math.max(
        0,
        Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000)
      ),
    },
  });

  await touchStreak(user.id);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/progress');

  return { ok: true, score, total: totalMarks };
}

/** Sets the signed-in student's avatar to an uploaded file. */
export async function setProfileImage(fileId: string | null): Promise<ActionResult> {
  const user = await requireUser();
  if (fileId !== null && !isId(fileId)) {
    return { ok: false, message: 'Invalid image reference.' };
  }

  if (fileId) {
    const file = await prisma.fileAsset.findUnique({
      where: { id: fileId },
      select: { kind: true, uploadedById: true },
    });
    if (!file || file.kind !== 'IMAGE') {
      return { ok: false, message: 'That file is not an image.' };
    }
    // Only the uploader may attach a file as their own avatar.
    if (file.uploadedById !== user.id) {
      return { ok: false, message: 'That file does not belong to you.' };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { image: fileId ? `/api/files/${fileId}` : null },
  });

  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard');

  return { ok: true };
}
