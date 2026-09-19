import type { Metadata } from 'next';
import { Download, ExternalLink, FileText } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getStudentPyqs, getStudentFilterOptions } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { StudentFilterBar } from '@/components/student/filter-bar';
import { BookmarkButton } from '@/components/student/bookmark-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'PYQs' };

export default async function StudentPyqsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser('/dashboard/pyqs');
  const sp = await searchParams;
  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = {
    q: one('q'),
    boardId: one('boardId'),
    classId: one('classId'),
    subjectId: one('subjectId'),
    chapterId: one('chapterId'),
    year: one('year'),
  };

  const [{ rows, years }, options] = await Promise.all([
    getStudentPyqs(user.id, filters),
    getStudentFilterOptions(),
  ]);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-8">
      <PageHeading
        title="📝 Previous Year Questions"
        description="Board question papers with solutions where available."
      />

      <StudentFilterBar
        searchPlaceholder="Search papers..."
        filters={[
          {
            key: 'boardId',
            label: 'Boards',
            options: options.boards.map((b) => ({ value: b.id, label: b.name })),
          },
          {
            key: 'classId',
            label: 'Classes',
            options: options.classes.map((c) => {
              const board = options.boards.find((b) => b.id === c.boardId);
              return { value: c.id, label: `${board?.name ?? '?'} · ${c.name}` };
            }),
          },
          {
            key: 'subjectId',
            label: 'Subjects',
            options: options.subjects.map((s) => ({
              value: s.id,
              label: `${s.class.name} · ${s.name}`,
            })),
          },
          {
            key: 'year',
            label: 'Years',
            options: years.map((y) => ({ value: String(y), label: String(y) })),
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon="📝"
          title={hasFilters ? 'No papers match those filters' : 'No question papers yet'}
          description={
            hasFilters
              ? 'Try clearing a filter or searching for a different subject or year.'
              : 'Question papers appear here once an admin publishes them.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((pyq) => (
            <Card key={pyq.id} className="flex h-full flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <FileText className="size-6 shrink-0 text-brand-gold" />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge>{pyq.year}</Badge>
                    <Badge variant="muted">{pyq.subject.class.board.name}</Badge>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{pyq.title}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {pyq.subject.name} · {pyq.subject.class.name}
                    {pyq.chapter ? ` · Ch ${pyq.chapter.number}: ${pyq.chapter.title}` : ''}
                  </p>
                  {pyq.examSession ? (
                    <p className="mt-1 text-xs text-white/45">{pyq.examSession}</p>
                  ) : null}
                  {pyq.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-white/60">{pyq.description}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pyq.questionFileId ? (
                    <>
                      <Button asChild size="sm">
                        <a href={`/api/files/${pyq.questionFileId}`} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} /> Paper
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href={`/api/files/${pyq.questionFileId}?download=1`}>
                          <Download size={14} />
                        </a>
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-white/40">No PDF uploaded yet</span>
                  )}

                  {pyq.solutionFileId ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={`/api/files/${pyq.solutionFileId}`} target="_blank" rel="noreferrer">
                        Solution
                      </a>
                    </Button>
                  ) : null}

                  <BookmarkButton
                    pyqId={pyq.id}
                    initial={pyq.bookmarks.length > 0}
                    showLabel={false}
                    variant="ghost"
                    className="ml-auto"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
