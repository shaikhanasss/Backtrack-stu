import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ListChecks, Target, History } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getQuizIntro } from '@/server/student-queries';
import { Breadcrumbs } from '@/components/student/breadcrumbs';
import { StartQuizButton } from '@/app/dashboard/quiz/[quizId]/start-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, percentage } from '@/lib/utils';

export const metadata: Metadata = { title: 'Quiz' };

export default async function QuizIntroPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const user = await requireUser();
  const { quizId } = await params;

  const quiz = await getQuizIntro(quizId, user.id);
  if (!quiz || quiz.questions.length === 0) notFound();

  const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
  const best = quiz.attempts.length
    ? Math.max(...quiz.attempts.map((a) => percentage(a.score, a.totalQuestions)))
    : null;

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Quizzes', href: '/dashboard/quiz' },
          { label: quiz.title },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              <p className="mt-1 text-sm text-white/60">
                {quiz.subject.icon} {quiz.subject.name} · {quiz.subject.class.board.name} ·{' '}
                {quiz.subject.class.name}
                {quiz.chapter ? ` · Chapter ${quiz.chapter.number}: ${quiz.chapter.title}` : ''}
              </p>
            </div>
            {best !== null ? <Badge>Best {best}%</Badge> : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {quiz.description ? <p className="text-white/75">{quiz.description}</p> : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <Fact icon={<ListChecks size={16} />} label="Questions" value={String(quiz.questions.length)} />
            <Fact icon={<Clock size={16} />} label="Time limit" value={`${quiz.durationMin} min`} />
            <Fact icon={<Target size={16} />} label="Pass mark" value={`${quiz.passingScore}%`} />
          </div>

          <p className="text-sm text-white/55">
            {totalMarks} marks in total. You can move between questions freely and
            change answers until you submit.
          </p>

          <StartQuizButton quizId={quiz.id} hasAttempts={quiz.attempts.length > 0} />
        </CardContent>
      </Card>

      {quiz.attempts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/55">
            <History size={14} /> Your previous attempts
          </h2>
          <div className="space-y-2">
            {quiz.attempts.map((attempt) => {
              const pct = percentage(attempt.score, attempt.totalQuestions);
              return (
                <Card key={attempt.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="text-sm">
                      <span className="font-semibold text-white">
                        {attempt.score}/{attempt.totalQuestions}
                      </span>
                      <span className="ml-2 text-white/55">
                        {attempt.completedAt ? formatDate(attempt.completedAt) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={pct >= quiz.passingScore ? 'default' : 'muted'}>{pct}%</Badge>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/quiz/result/${attempt.id}`}>Review</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
        {icon} {label}
      </div>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
