import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, Gamepad2 } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getSubjectWithChapters } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { Breadcrumbs } from '@/components/student/breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { percentage } from '@/lib/utils';

export const metadata: Metadata = { title: 'Chapters' };

/** Level 4: chapters, each showing this student's own completion. */
export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const user = await requireUser();
  const { subjectId } = await params;

  const subject = await getSubjectWithChapters(subjectId, user.id);
  if (!subject) notFound();

  const totalNotes = subject.chapters.reduce((sum, c) => sum + c.noteCount, 0);
  const totalDone = subject.chapters.reduce((sum, c) => sum + c.completedCount, 0);

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Study Material', href: '/dashboard/notes' },
          { label: subject.class.board.name, href: `/dashboard/notes/${subject.class.board.slug}` },
          {
            label: subject.class.name,
            href: `/dashboard/notes/${subject.class.board.slug}/${subject.class.slug}`,
          },
          { label: subject.name },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title={`${subject.icon ?? '📖'} ${subject.name}`}
          description={subject.description ?? undefined}
        />
        <div className="flex flex-wrap gap-2">
          {subject.stream ? <Badge variant="secondary">{subject.stream.name}</Badge> : null}
          {subject.code ? <Badge variant="muted">{subject.code}</Badge> : null}
        </div>
      </div>

      {totalNotes > 0 ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-white/70">Your progress in this subject</span>
              <span className="font-semibold text-white">
                {totalDone} of {totalNotes} completed
              </span>
            </div>
            <Progress value={percentage(totalDone, totalNotes)} />
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {subject._count.pyqs > 0 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/pyqs?subjectId=${subject.id}`}>
              <FileText size={14} /> {subject._count.pyqs} question papers
            </Link>
          </Button>
        ) : null}
        {subject._count.quizzes > 0 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/quiz?subjectId=${subject.id}`}>
              <Gamepad2 size={14} /> {subject._count.quizzes} quizzes
            </Link>
          </Button>
        ) : null}
      </div>

      {subject.chapters.length === 0 ? (
        <EmptyState
          icon="📑"
          title="No chapters yet"
          description="This subject has no active chapters. Chapters are added from the admin panel."
        />
      ) : (
        <div className="space-y-3">
          {subject.chapters.map((chapter) => (
            <Link key={chapter.id} href={`/dashboard/chapters/${chapter.id}`} className="block">
              <Card className="card-hover">
                <CardContent className="flex flex-wrap items-center gap-4 p-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-brand-gold">
                    {chapter.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{chapter.title}</p>
                    {chapter.description ? (
                      <p className="mt-0.5 line-clamp-1 text-sm text-white/55">
                        {chapter.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap text-sm text-white/60">
                      {chapter.completedCount}/{chapter.noteCount} done
                    </span>
                    {chapter.noteCount > 0 && chapter.completedCount === chapter.noteCount ? (
                      <Badge>Complete</Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
