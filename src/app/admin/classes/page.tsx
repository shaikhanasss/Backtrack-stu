import type { Metadata } from 'next';
import { Plus } from 'lucide-react';

import { listClasses, getFormOptions } from '@/server/admin-queries';
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
import { ClassForm } from '@/app/admin/classes/class-form';

export const metadata: Metadata = { title: 'Classes' };

const SORTS = [
  { value: 'level', label: 'Level' },
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created' },
];

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, {
    defaultSort: 'level',
    allowedSorts: SORTS.map((s) => s.value),
    filterKeys: ['boardId', 'status'],
  });

  const [{ rows, total, page, pageSize, pageCount }, options] = await Promise.all([
    listClasses(params),
    getFormOptions(),
  ]);

  return (
    <AdminPageShell
      title="Classes"
      description="A year of schooling within a board — SSC has Class 10, HSC has 11 and 12."
      action={
        <ResourceDialog
          trigger={<Button><Plus size={16} /> New class</Button>}
          title="Create class"
        >
          <ClassForm options={options}/>
        </ResourceDialog>
      }
      toolbar={
        <AdminToolbar
          searchPlaceholder="Search classes..."
          sorts={SORTS}
          filters={[
            {
              key: 'boardId',
              label: 'Boards',
              options: options.boards.map((b) => ({ value: b.id, label: b.name })),
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
          icon="📅"
          title={params.q ? `No classes match "${params.q}"` : 'No classes yet'}
          description={
            params.q
              ? 'Try a different search term or clear the filters.'
              : 'Create a class and assign it to a board.'
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Subjects</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((klass) => (
                  <TableRow key={klass.id}>
                    <TableCell className="font-medium text-white">{klass.name}</TableCell>
                    <TableCell><Badge variant="muted">{klass.board.name}</Badge></TableCell>
                    <TableCell className="tabular-nums">{klass.level}</TableCell>
                    <TableCell className="font-mono text-xs text-white/60">{klass.slug}</TableCell>
                    <TableCell className="text-right tabular-nums">{klass._count.subjects}</TableCell>
                    <TableCell>
                      <ActiveToggle
                        entity="class"
                        id={klass.id}
                        isActive={klass.isActive}
                        label={klass.name}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ResourceDialog trigger={<EditButton />} title={`Edit ${klass.name}`}>
                          <ClassForm klass={klass} options={options}/>
                        </ResourceDialog>
                        <DeleteResourceDialog
                          entity="class"
                          id={klass.id}
                                                    title={`Delete ${klass.name}?`}
                          confirmLabel="Delete class"
                          description={
                            <>
                              This deletes the class and its{' '}
                              <strong>{klass._count.subjects} subject(s)</strong>, along with
                              every chapter, note, PYQ and quiz beneath them. This cannot be
                              undone.
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
