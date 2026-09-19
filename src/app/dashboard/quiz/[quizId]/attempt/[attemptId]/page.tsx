import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { getAttemptForPlaying } from '@/server/student-queries';
import { QuizPlayer } from '@/app/dashboard/quiz/[quizId]/attempt/[attemptId]/quiz-player';

export const metadata: Metadata = { title: 'Quiz in progress' };

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { attemptId } = await params;

  // Scoped to the caller, so one student cannot open another's attempt.
  const attempt = await getAttemptForPlaying(attemptId, user.id);
  if (!attempt) notFound();

  // Already submitted: send the student to the result rather than letting them
  // answer a closed attempt.
  if (attempt.completedAt) redirect(`/dashboard/quiz/result/${attempt.id}`);
  if (attempt.quiz.questions.length === 0) notFound();

  const initialAnswers =
    attempt.answers && typeof attempt.answers === 'object' && !Array.isArray(attempt.answers)
      ? (attempt.answers as Record<string, number>)
      : {};

  return (
    <QuizPlayer
      attemptId={attempt.id}
      title={attempt.quiz.title}
      questions={attempt.quiz.questions}
      durationMin={attempt.quiz.durationMin}
      startedAt={attempt.startedAt.toISOString()}
      initialAnswers={initialAnswers}
    />
  );
}
