'use server';

import { prisma } from '@/lib/prisma';
import type { ContentStatus } from '@prisma/client';

import { quizSchema, quizQuestionSchema } from '@/lib/validators/admin';
import { adminMutation, adminOperation, ADMIN_PATHS } from '@/server/actions/admin/shared';
import type { ActionResult } from '@/server/actions/auth-actions';

const QUIZ_PATHS = [ADMIN_PATHS.dashboard, ADMIN_PATHS.quizzes, '/dashboard/quiz', '/'];

function publishFields(status: ContentStatus, existingPublishedAt: Date | null) {
  return {
    status,
    publishedAt: status === 'PUBLISHED' ? (existingPublishedAt ?? new Date()) : existingPublishedAt,
  };
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export async function createQuiz(input: unknown): Promise<ActionResult> {
  return adminMutation(quizSchema, input, async (data) => {
    const { status, ...rest } = data;
    await prisma.quiz.create({ data: { ...rest, ...publishFields(status, null) } });
  }, {
    revalidate: QUIZ_PATHS,
    uniqueMessage: { slug: 'A quiz with that slug already exists for this subject' },
  });
}

export async function updateQuiz(id: string, input: unknown): Promise<ActionResult> {
  return adminMutation(quizSchema, input, async (data) => {
    const { status, ...rest } = data;
    const existing = await prisma.quiz.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    await prisma.quiz.update({
      where: { id },
      data: { ...rest, ...publishFields(status, existing?.publishedAt ?? null) },
    });
  }, {
    revalidate: QUIZ_PATHS,
    uniqueMessage: { slug: 'A quiz with that slug already exists for this subject' },
  });
}

export async function deleteQuiz(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.quiz.delete({ where: { id } });
  }, { revalidate: QUIZ_PATHS });
}

/**
 * Publishing a quiz with no questions would show students an empty test, so
 * that transition is refused rather than silently allowed.
 */
export async function setQuizStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  if (status === 'PUBLISHED') {
    const count = await prisma.quizQuestion.count({ where: { quizId: id } });
    if (count === 0) {
      return { ok: false, message: 'Add at least one question before publishing this quiz.' };
    }
  }

  return adminOperation(async () => {
    const existing = await prisma.quiz.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    await prisma.quiz.update({
      where: { id },
      data: publishFields(status, existing?.publishedAt ?? null),
    });
  }, { revalidate: QUIZ_PATHS });
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export async function createQuizQuestion(input: unknown): Promise<ActionResult> {
  return adminMutation(quizQuestionSchema, input, async (data) => {
    // Append to the end unless the admin set an explicit order.
    const order =
      data.displayOrder ||
      (await prisma.quizQuestion.count({ where: { quizId: data.quizId } })) + 1;

    await prisma.quizQuestion.create({ data: { ...data, displayOrder: order } });
  }, { revalidate: QUIZ_PATHS });
}

export async function updateQuizQuestion(id: string, input: unknown): Promise<ActionResult> {
  return adminMutation(quizQuestionSchema, input, async (data) => {
    await prisma.quizQuestion.update({ where: { id }, data });
  }, { revalidate: QUIZ_PATHS });
}

export async function deleteQuizQuestion(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    const question = await prisma.quizQuestion.findUnique({
      where: { id },
      select: { quizId: true },
    });

    await prisma.quizQuestion.delete({ where: { id } });

    // A published quiz must never be left with zero questions.
    if (question) {
      const remaining = await prisma.quizQuestion.count({ where: { quizId: question.quizId } });
      if (remaining === 0) {
        await prisma.quiz.updateMany({
          where: { id: question.quizId, status: 'PUBLISHED' },
          data: { status: 'DRAFT' },
        });
      }
    }
  }, { revalidate: QUIZ_PATHS });
}
