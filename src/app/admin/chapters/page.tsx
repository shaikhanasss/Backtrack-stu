import type { Metadata } from 'next';
import { Plus } from 'lucide-react';

import { listChapters, getFormOptions } from '@/server/admin-queries';
import { parseListParams } from '@/lib/admin/query-params';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminToolbar } from '@/components/admin/admin-toolbar';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { ResourceDialog } from '@/components/admin/resource-dialog';
import { DeleteResourceDialog } from '@/components/admin/delete-dialog';
import { ActiveToggle } from '@/components/admin/status-controls';
import { EditButton } from '@/components/admin/row-actions';
import { EmptyState } from '@/components/brand/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ChapterForm } from '@/app/admin/chapters/chapter-form';
import { subjectLabel } from '@/lib/admin/labels';

export const metadata: Metadata = { title: 'Chapters' };

const SORTS = [
  { value: 'number', label: 'Chapter number' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'title', label: 'Title' },
  { value: 'createdAt', label: 'Created' },
];

export default async function AdminChaptersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, {
    defaultSort: 'number',
    allowedSorts: SORTS.map((s) => s.value),
    filterKeys: ['subjectId', 'classId', 'status'],
  });

  const [{ rows, total, page, pageSize, pageCount }, options] = await Promise.all([
    listChapters(params),
    getFormOptions(),
  ]);

  return (
    <AdminPageShell
      title="Chapters"
      description="Ordered units within a subject. Notes and quizzes hang off these."
      action={
        <ResourceDialog
          trigger={<Button><Plus size={16} /> New chapter</Button>}
          title="Create chapter"
        >
          <ChapterForm options={options}/>
        </ResourceDialog>
      }
      toolbar={
        <AdminToolbar
          searchPlaceholder="Search chapters..."
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
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />
      }
      footer={<AdminPagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} />}
    >
      {rows.length === 0 ? (
        <EmptyState
          icon="📑"
          title={params.q ? `No chapters match "${params.q}"` : 'No chapters yet'}
          description="Create a chapter under a subject before adding notes or quizzes."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Notes</TableHead>
                  <TableHead className="text-right">Quizzes</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((chapter) => (
                  <TableRow key={chapter.id}>
                    <TableCell className="tabular-nums text-white/70">{chapter.number}</TableCell>
                    <TableCell>
                      <div className="font-medium text-white">{chapter.title}</div>
                      <div className="font-mono text-xs text-white/45">{chapter.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {chapter.subject.class.board.name} · {chapter.subject.class.name} ·{' '}
                      {chapter.subject.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{chapter._count.notes}</TableCell>
                    <TableCell className="text-right tabular-nums">{chapter._count.quizzes}</TableCell>
                    <TableCell>
                      <ActiveToggle
                        entity="chapter"
                        id={chapter.id}
                        isActive={chapter.isActive}
                        label={chapter.title}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ResourceDialog trigger={<EditButton />} title={`Edit ${chapter.title}`}>
                          <ChapterForm chapter={chapter} options={options}/>
                        </ResourceDialog>
                        <DeleteResourceDialog
                          entity="chapter"
                          id={chapter.id}
                                                    title={`Delete chapter ${chapter.number}?`}
                          confirmLabel="Delete chapter"
                          description={
                            <>
                              &ldquo;{chapter.title}&rdquo; and its{' '}
                              <strong>{chapter._count.notes} note(s)</strong> and{' '}
                              <strong>{chapter._count.quizzes} quiz(zes)</strong> will be
                              permanently deleted. This cannot be undone.
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
