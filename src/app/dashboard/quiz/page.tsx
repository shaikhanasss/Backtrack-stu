import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ListChecks } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getStudentQuizzes, getStudentFilterOptions } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { StudentFilterBar } from '@/components/student/filter-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { percentage } from '@/lib/utils';

export const metadata: Metadata = { title: 'Quiz' };

export default async function StudentQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser('/dashboard/quiz');
  const sp = await searchParams;
  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = { q: one('q'), subjectId: one('subjectId') };

  const [quizzes, options] = await Promise.all([
    getStudentQuizzes(user.id, filters),
    getStudentFilterOptions(),
  ]);

  const hasFilters = Boolean(filters.q || filters.subjectId);

  return (
    <div className="space-y-8">
      <PageHeading
        title="🎮 Quizzes"
        description="Practise with chapter-wise and subject-wide question sets."
      />

      <StudentFilterBar
        searchPlaceholder="Search quizzes..."
        filters={[
          {
            key: 'subjectId',
            label: 'Subjects',
            options: options.subjects.map((s) => ({
              value: s.id,
              label: `${s.class.name} · ${s.name}`,
            })),
          },
        ]}
      />

      {quizzes.length === 0 ? (
        <EmptyState
          icon="🎮"
          title={hasFilters ? 'No quizzes match those filters' : 'No quizzes available yet'}
          description={
            hasFilters
              ? 'Try a different subject or clear the search.'
              : 'Quizzes appear here once an admin publishes one with questions.'
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const last = quiz.attempts[0];
            const lastPct = last ? percentage(last.score, last.totalQuestions) : null;

            return (
              <Card key={quiz.id} className="flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl" aria-hidden="true">{quiz.subject.icon ?? '🎮'}</span>
                    {lastPct !== null ? (
                      <Badge variant={lastPct >= quiz.passingScore ? 'default' : 'muted'}>
                        Last {lastPct}%
                      </Badge>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{quiz.title}</p>
                    <p className="mt-1 text-xs text-white/55">
                      {quiz.subject.class.board.name} · {quiz.subject.name}
                      {quiz.chapter ? ` · Ch ${quiz.chapter.number}` : ''}
                    </p>
                    {quiz.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-white/60">{quiz.description}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <ListChecks size={12} /> {quiz._count.questions} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {quiz.durationMin} min
                    </span>
                  </div>

                  <Button asChild size="sm" className="w-full">
                    <Link href={`/dashboard/quiz/${quiz.id}`}>
                      {last ? 'Take again' : 'Start quiz'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
