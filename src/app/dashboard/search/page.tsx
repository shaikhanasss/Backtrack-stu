import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, FileText, Gamepad2, ListOrdered, Library } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { globalSearch } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { SearchBox } from '@/components/brand/search-box';
import { BookmarkButton } from '@/components/student/bookmark-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Search' };

/**
 * Global academic search across every content type students can reach.
 * Each section is omitted entirely when it has no hits, so the page never shows
 * a wall of empty headings.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser('/dashboard/search');
  const { q = '' } = await searchParams;

  const results = await globalSearch(q, user.id);
  const typed = q.trim().length >= 2;

  return (
    <div className="space-y-8">
      <PageHeading
        title="🔍 Search"
        description="Find study material, chapters, subjects, question papers and quizzes."
      />

      <SearchBox defaultValue={q} />

      {!typed ? (
        <EmptyState
          icon="🔍"
          title="Type at least two characters"
          description="Search runs across notes, chapter titles, subject names and codes, question papers and quizzes."
        />
      ) : results.total === 0 ? (
        <EmptyState
          icon="🤔"
          title={`No results for "${results.q}"`}
          description="Try a different subject, chapter or paper name."
        />
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-white/55">
            {results.total} result{results.total === 1 ? '' : 's'} for &ldquo;{results.q}&rdquo;
          </p>

          {results.notes.length > 0 ? (
            <Section icon={<BookOpen size={14} />} title={`Study material (${results.notes.length})`}>
              {results.notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <span aria-hidden="true">{note.chapter.subject.icon ?? '📄'}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/material/${note.id}`}
                        className="font-medium text-white hover:text-brand-gold"
                      >
                        {note.title}
                      </Link>
                      <p className="truncate text-xs text-white/50">
                        {note.chapter.subject.name} · Ch {note.chapter.number}: {note.chapter.title}
                      </p>
                    </div>
                    <BookmarkButton
                      noteId={note.id}
                      initial={note.bookmarks.length > 0}
                      showLabel={false}
                      variant="ghost"
                    />
                  </CardContent>
                </Card>
              ))}
            </Section>
          ) : null}

          {results.chapters.length > 0 ? (
            <Section icon={<ListOrdered size={14} />} title={`Chapters (${results.chapters.length})`}>
              {results.chapters.map((chapter) => (
                <Card key={chapter.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <span aria-hidden="true">{chapter.subject.icon ?? '📑'}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/chapters/${chapter.id}`}
                        className="font-medium text-white hover:text-brand-gold"
                      >
                        {chapter.number}. {chapter.title}
                      </Link>
                      <p className="truncate text-xs text-white/50">
                        {chapter.subject.name} · {chapter.subject.class.name}
                      </p>
                    </div>
                    <Badge variant="muted">{chapter._count.notes} notes</Badge>
                  </CardContent>
                </Card>
              ))}
            </Section>
          ) : null}

          {results.subjects.length > 0 ? (
            <Section icon={<Library size={14} />} title={`Subjects (${results.subjects.length})`}>
              {results.subjects.map((subject) => (
                <Card key={subject.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <span aria-hidden="true">{subject.icon ?? '📖'}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/subjects/${subject.id}`}
                        className="font-medium text-white hover:text-brand-gold"
                      >
                        {subject.name}
                      </Link>
                      <p className="truncate text-xs text-white/50">
                        {subject.class.board.name} · {subject.class.name}
                        {subject.stream ? ` · ${subject.stream.name}` : ''}
                      </p>
                    </div>
                    {subject.code ? <Badge variant="muted">{subject.code}</Badge> : null}
                    <Badge variant="outline">{subject._count.chapters} chapters</Badge>
                  </CardContent>
                </Card>
              ))}
            </Section>
          ) : null}

          {results.pyqs.length > 0 ? (
            <Section icon={<FileText size={14} />} title={`Question papers (${results.pyqs.length})`}>
              {results.pyqs.map((pyq) => (
                <Card key={pyq.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <FileText size={16} className="shrink-0 text-brand-gold" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/pyqs?q=${encodeURIComponent(pyq.title)}`}
                        className="font-medium text-white hover:text-brand-gold"
                      >
                        {pyq.title}
                      </Link>
                      <p className="truncate text-xs text-white/50">
                        {pyq.subject.name} · {pyq.subject.class.name}
                      </p>
                    </div>
                    <Badge>{pyq.year}</Badge>
                  </CardContent>
                </Card>
              ))}
            </Section>
          ) : null}

          {results.quizzes.length > 0 ? (
            <Section icon={<Gamepad2 size={14} />} title={`Quizzes (${results.quizzes.length})`}>
              {results.quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <span aria-hidden="true">{quiz.subject.icon ?? '🎮'}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/quiz/${quiz.id}`}
                        className="font-medium text-white hover:text-brand-gold"
                      >
                        {quiz.title}
                      </Link>
                      <p className="truncate text-xs text-white/50">{quiz.subject.name}</p>
                    </div>
                    <Badge variant="muted">{quiz._count.questions} questions</Badge>
                  </CardContent>
                </Card>
              ))}
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/55">
        {icon} {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
