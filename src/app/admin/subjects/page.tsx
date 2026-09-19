import type { Metadata } from 'next';
import { Plus } from 'lucide-react';

import { listSubjects, getFormOptions } from '@/server/admin-queries';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SubjectForm } from '@/app/admin/subjects/subject-form';

export const metadata: Metadata = { title: 'Subjects' };

const SORTS = [
  { value: 'displayOrder', label: 'Display order' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'createdAt', label: 'Created' },
];

export default async function AdminSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, {
    defaultSort: 'displayOrder',
    allowedSorts: SORTS.map((s) => s.value),
    filterKeys: ['boardId', 'classId', 'streamId', 'status'],
  });

  const [{ rows, total, page, pageSize, pageCount }, options] = await Promise.all([
    listSubjects(params),
    getFormOptions(),
  ]);

  return (
    <AdminPageShell
      title="Subjects"
      description="Taught in a class, optionally narrowed to a stream."
      action={
        <ResourceDialog
          trigger={<Button><Plus size={16} /> New subject</Button>}
          title="Create subject"
        >
          <SubjectForm options={options}/>
        </ResourceDialog>
      }
      toolbar={
        <AdminToolbar
          searchPlaceholder="Search by name or code..."
          sorts={SORTS}
          filters={[
            {
              key: 'classId',
              label: 'Classes',
              options: options.classes.map((c) => {
                const board = options.boards.find((b) => b.id === c.boardId);
                return { value: c.id, label: `${board?.name ?? '?'} · ${c.name}` };
              }),
            },
            {
              key: 'streamId',
              label: 'Streams',
              options: [
                { value: 'none', label: 'No stream' },
                ...options.streams.map((s) => ({ value: s.id, label: s.name })),
              ],
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
          icon="📖"
          title={params.q ? `No subjects match "${params.q}"` : 'No subjects yet'}
          description="Create a subject under a class to start adding chapters."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Board / Class</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead className="text-right">Chapters</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium text-white">
                        <span aria-hidden="true">{subject.icon ?? '📖'}</span>
                        {subject.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white/60">
                      {subject.code ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {subject.class.board.name} · {subject.class.name}
                    </TableCell>
                    <TableCell>
                      {subject.stream ? (
                        <Badge variant="secondary">{subject.stream.name}</Badge>
                      ) : (
                        <span className="text-xs text-white/40">All streams</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {subject._count.chapters}
                    </TableCell>
                    <TableCell className="tabular-nums">{subject.displayOrder}</TableCell>
                    <TableCell>
                      <ActiveToggle
                        entity="subject"
                        id={subject.id}
                        isActive={subject.isActive}
                        label={subject.name}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ResourceDialog trigger={<EditButton />} title={`Edit ${subject.name}`}>
                          <SubjectForm subject={subject} options={options}/>
                        </ResourceDialog>
                        <DeleteResourceDialog
                          entity="subject"
                          id={subject.id}
                                                    title={`Delete ${subject.name}?`}
                          confirmLabel="Delete subject"
                          description={
                            <>
                              This deletes <strong>{subject._count.chapters} chapter(s)</strong>,{' '}
                              <strong>{subject._count.pyqs} PYQ(s)</strong> and{' '}
                              <strong>{subject._count.quizzes} quiz(zes)</strong>, plus every
                              note beneath them. This cannot be undone.
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
