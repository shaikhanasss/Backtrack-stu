import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, FileText, Gamepad2, Image as ImageIcon } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getChapterWithMaterial } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { Breadcrumbs } from '@/components/student/breadcrumbs';
import { BookmarkButton } from '@/components/student/bookmark-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Chapter' };

/** Level 5: everything filed under one chapter. */
export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const user = await requireUser();
  const { chapterId } = await params;

  const chapter = await getChapterWithMaterial(chapterId, user.id);
  if (!chapter) notFound();

  const { subject } = chapter;

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
          { label: subject.name, href: `/dashboard/subjects/${subject.id}` },
          { label: `Chapter ${chapter.number}` },
        ]}
      />

      <PageHeading
        title={`${chapter.number}. ${chapter.title}`}
        description={chapter.description ?? undefined}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
          Study material
        </h2>

        {chapter.notes.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No material published yet"
            description="Nothing has been published for this chapter. Check back later."
          />
        ) : (
          <div className="space-y-3">
            {chapter.notes.map((note) => {
              const completed = note.progress[0]?.status === 'COMPLETED';
              const started = note.progress.length > 0;

              return (
                <Card key={note.id}>
                  <CardContent className="flex flex-wrap items-start gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/material/${note.id}`}
                        className="font-semibold text-white hover:text-brand-gold"
                      >
                        {note.title}
                      </Link>
                      {note.summary ? (
                        <p className="mt-1 line-clamp-2 text-sm text-white/60">{note.summary}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/45">
                        {note.pdfFileId ? (
                          <span className="flex items-center gap-1"><FileText size={12} /> PDF</span>
                        ) : null}
                        {note._count.images > 0 ? (
                          <span className="flex items-center gap-1">
                            <ImageIcon size={12} /> {note._count.images} images
                          </span>
                        ) : null}
                        <span>{note.viewCount} views</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {completed ? (
                        <Badge><CheckCircle2 size={12} /> Completed</Badge>
                      ) : started ? (
                        <Badge variant="muted">In progress</Badge>
                      ) : null}
                      <BookmarkButton
                        noteId={note.id}
                        initial={note.bookmarks.length > 0}
                        showLabel={false}
                        variant="ghost"
                      />
                      <Button asChild size="sm">
                        <Link href={`/dashboard/material/${note.id}`}>
                          {started ? 'Continue' : 'Open'}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {chapter.quizzes.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">Quizzes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {chapter.quizzes.map((quiz) => (
              <Card key={quiz.id} className="card-hover">
                <CardHeader>
                  <CardTitle className="text-base">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-white/60">
                    {quiz._count.questions} questions · {quiz.durationMin} min
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/quiz/${quiz.id}`}>
                      <Gamepad2 size={14} /> Start
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {chapter.pyqs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            Question papers for this chapter
          </h2>
          <div className="flex flex-wrap gap-2">
            {chapter.pyqs.map((pyq) => (
              <Button key={pyq.id} asChild variant="outline" size="sm">
                <Link href={`/dashboard/pyqs?q=${encodeURIComponent(pyq.title)}`}>
                  <FileText size={14} /> {pyq.title} ({pyq.year})
                </Link>
              </Button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
