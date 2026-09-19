import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, ListChecks } from 'lucide-react';

import { listQuizzes, getFormOptions } from '@/server/admin-queries';
import { parseListParams } from '@/lib/admin/query-params';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminToolbar } from '@/components/admin/admin-toolbar';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { ResourceDialog } from '@/components/admin/resource-dialog';
import { DeleteResourceDialog } from '@/components/admin/delete-dialog';
import { PublishToggle } from '@/components/admin/status-controls';
import { EditButton } from '@/components/admin/row-actions';
import { EmptyState } from '@/components/brand/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { QuizForm } from '@/app/admin/quizzes/quiz-form';
import { subjectLabel } from '@/lib/admin/labels';

export const metadata: Metadata = { title: 'Quizzes' };

const SORTS = [
  { value: 'createdAt', label: 'Created' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
];

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, {
    defaultSort: 'createdAt',
    defaultDir: 'desc',
    allowedSorts: SORTS.map((s) => s.value),
    filterKeys: ['subjectId', 'status'],
  });

  const [{ rows, total, page, pageSize, pageCount }, options] = await Promise.all([
    listQuizzes(params),
    getFormOptions(),
  ]);

  return (
    <AdminPageShell
      title="Quizzes"
      description="Create a quiz, then open it to build its questions."
      action={
        <ResourceDialog
          trigger={<Button><Plus size={16} /> New quiz</Button>}
          title="Create quiz"
          className="max-w-2xl"
        >
          <QuizForm options={options}/>
        </ResourceDialog>
      }
      toolbar={
        <AdminToolbar
          searchPlaceholder="Search quizzes..."
          sorts={SORTS}
          filters={[
            {
              key: 'subjectId',
              label: 'Subjects',
              options: options.subjects.map((s) => ({
                value: s.id,
                label: subjectLabel(s, options),
              })),
            },
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'ARCHIVED', label: 'Archived' },
              ],
            },
          ]}
        />
      }
      footer={<AdminPagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} />}
    >
      {rows.length === 0 ? (
        <EmptyState
          icon="🎮"
          title={params.q ? `No quizzes match "${params.q}"` : 'No quizzes yet'}
          description="Create a quiz against a subject or chapter, then add its questions."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell>
                      <Link
                        href={`/admin/quizzes/${quiz.id}`}
                        className="font-medium text-white hover:text-brand-gold"
                      >
                        {quiz.title}
                      </Link>
                      <div className="text-xs text-white/50">
                        {quiz.chapter
                          ? `Chapter ${quiz.chapter.number}: ${quiz.chapter.title}`
                          : 'Whole subject'}{' '}
                        · {quiz.durationMin} min
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {quiz.subject.class.board.name} · {quiz.subject.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {quiz._count.questions}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {quiz._count.attempts}
                    </TableCell>
                    <TableCell>
                      <PublishToggle
                        entity="quiz"
                        id={quiz.id}
                        status={quiz.status}
                        label={quiz.title}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/quizzes/${quiz.id}`}>
                            <ListChecks size={14} />
                            <span className="sr-only sm:not-sr-only">Questions</span>
                          </Link>
                        </Button>
                        <ResourceDialog
                          trigger={<EditButton />}
                          title={`Edit ${quiz.title}`}
                          className="max-w-2xl"
                        >
                          <QuizForm
                              quiz={{
                                id: quiz.id,
                                subjectId: quiz.subjectId,
                                chapterId: quiz.chapterId,
                                title: quiz.title,
                                slug: quiz.slug,
                                description: quiz.description,
                                durationMin: quiz.durationMin,
                                passingScore: quiz.passingScore,
                                status: quiz.status,
                              }}
                              options={options}/>
                        </ResourceDialog>
                        <DeleteResourceDialog
                          entity="quiz"
                          id={quiz.id}
                                                    title={`Delete ${quiz.title}?`}
                          confirmLabel="Delete quiz"
                          description={
                            <>
                              This deletes the quiz, its{' '}
                              <strong>{quiz._count.questions} question(s)</strong> and{' '}
                              <strong>{quiz._count.attempts} student attempt(s)</strong>. This
                              cannot be undone.
                            </>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminPageShell>
  );
}
