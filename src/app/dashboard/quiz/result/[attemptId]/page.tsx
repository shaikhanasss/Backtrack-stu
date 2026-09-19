import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle, MinusCircle, RotateCcw } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getAttemptResult } from '@/server/student-queries';
import { Breadcrumbs } from '@/components/student/breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/brand/stat-card';
import { cn, percentage } from '@/lib/utils';

export const metadata: Metadata = { title: 'Quiz Result' };

const LETTERS = ['A', 'B', 'C', 'D'];

export default async function QuizResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await requireUser();
  const { attemptId } = await params;

  const attempt = await getAttemptResult(attemptId, user.id);
  if (!attempt) notFound();

  const answers = (attempt.answers ?? {}) as Record<string, number>;
  const questions = attempt.quiz.questions;

  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const wrong = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== q.correctIndex
  ).length;
  const skipped = questions.length - correct - wrong;

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const pct = percentage(attempt.score, totalMarks);
  const passed = pct >= attempt.quiz.passingScore;

  const minutes = attempt.timeTakenSec ? Math.floor(attempt.timeTakenSec / 60) : 0;
  const seconds = attempt.timeTakenSec ? attempt.timeTakenSec % 60 : 0;

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Quizzes', href: '/dashboard/quiz' },
          { label: attempt.quiz.title, href: `/dashboard/quiz/${attempt.quiz.id}` },
          { label: 'Result' },
        ]}
      />

      <Card>
        <CardContent className="space-y-6 p-8 text-center">
          <div className="text-5xl" aria-hidden="true">{passed ? '🎉' : '📘'}</div>

          <div>
            <h1 className="text-3xl font-bold text-white">
              {attempt.score} / {totalMarks}
            </h1>
            <p className="mt-1 text-white/65">{attempt.quiz.title}</p>
          </div>

          <Progress value={pct} className="mx-auto max-w-md" />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge variant={passed ? 'default' : 'muted'}>{pct}%</Badge>
            <Badge variant="outline">Pass mark {attempt.quiz.passingScore}%</Badge>
            <Badge variant={passed ? 'default' : 'destructive'}>
              {passed ? 'Passed' : 'Not passed'}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard value={correct} label="Correct" />
            <StatCard value={wrong} label="Incorrect" />
            <StatCard value={skipped} label="Unanswered" />
            <StatCard
              value={attempt.timeTakenSec ? `${minutes}m ${seconds}s` : '—'}
              label="Time taken"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={`/dashboard/quiz/${attempt.quiz.id}`}>
                <RotateCcw size={16} /> Try again
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/progress">View progress</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
          Answer review
        </h2>

        {questions.map((question, index) => {
          const chosen = answers[question.id];
          const isCorrect = chosen === question.correctIndex;
          const unanswered = chosen === undefined;

          return (
            <Card key={question.id}>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-medium text-white">
                    <span className="mr-2 text-white/45">Q{index + 1}.</span>
                    {question.text}
                  </p>
                  <Badge
                    variant={isCorrect ? 'default' : unanswered ? 'muted' : 'destructive'}
                    className="shrink-0"
                  >
                    {isCorrect ? (
                      <><CheckCircle2 size={12} /> +{question.marks}</>
                    ) : unanswered ? (
                      <><MinusCircle size={12} /> Skipped</>
                    ) : (
                      <><XCircle size={12} /> 0</>
                    )}
                  </Badge>
                </div>

                <ul className="grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const isAnswer = optionIndex === question.correctIndex;
                    const isChosen = optionIndex === chosen;

                    return (
                      <li
                        key={optionIndex}
                        className={cn(
                          'flex items-start gap-2 rounded-xl border p-3 text-sm',
                          isAnswer
                            ? 'border-brand-gold/60 bg-brand-gold/10 text-white'
                            : isChosen
                              ? 'border-destructive/60 bg-destructive/10 text-white'
                              : 'border-white/10 bg-white/5 text-white/70'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            isAnswer
                              ? 'bg-brand-gold text-brand-navy'
                              : isChosen
                                ? 'bg-destructive text-white'
                                : 'bg-white/10 text-white/60'
                          )}
                        >
                          {LETTERS[optionIndex]}
                        </span>
                        <span className="min-w-0 flex-1">{option}</span>
                        {isAnswer ? (
                          <span className="shrink-0 text-[11px] uppercase tracking-wide text-brand-gold">
                            Correct
                          </span>
                        ) : isChosen ? (
                          <span className="shrink-0 text-[11px] uppercase tracking-wide text-destructive">
                            Yours
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {question.explanation ? (
                  <p className="rounded-xl bg-white/5 p-3 text-sm text-white/75">
                    <span className="font-semibold text-brand-gold">Explanation: </span>
                    {question.explanation}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
