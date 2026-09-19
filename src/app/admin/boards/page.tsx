import type { Metadata } from 'next';
import { Plus } from 'lucide-react';

import { listBoards } from '@/server/admin-queries';
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
import { BoardForm } from '@/app/admin/boards/board-form';

export const metadata: Metadata = { title: 'Boards' };

const SORTS = [
  { value: 'displayOrder', label: 'Display order' },
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created' },
];

export default async function AdminBoardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, {
    defaultSort: 'displayOrder',
    allowedSorts: SORTS.map((s) => s.value),
    filterKeys: ['status'],
  });

  const { rows, total, page, pageSize, pageCount } = await listBoards(params);

  return (
    <AdminPageShell
      title="Boards"
      description="Top level of the academic hierarchy: SSC and HSC."
      action={
        <ResourceDialog
          trigger={<Button><Plus size={16} /> New board</Button>}
          title="Create board"
          description="Boards contain classes and streams."
        >
          <BoardForm/>
        </ResourceDialog>
      }
      toolbar={
        <AdminToolbar
          searchPlaceholder="Search boards..."
          sorts={SORTS}
          filters={[
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
      footer={
        <AdminPagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} />
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon="🎓"
          title={params.q ? `No boards match "${params.q}"` : 'No boards yet'}
          description={
            params.q
              ? 'Try a different search term or clear the filters.'
              : 'Create a board to start building the academic hierarchy.'
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Board</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Classes</TableHead>
                  <TableHead className="text-right">Streams</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((board) => (
                  <TableRow key={board.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium text-white">
                        <span aria-hidden="true">{board.icon ?? '📘'}</span>
                        {board.name}
                      </div>
                      {board.description ? (
                        <div className="mt-0.5 max-w-md truncate text-xs text-white/50">
                          {board.description}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white/60">{board.slug}</TableCell>
                    <TableCell className="text-right tabular-nums">{board._count.classes}</TableCell>
                    <TableCell className="text-right tabular-nums">{board._count.streams}</TableCell>
                    <TableCell className="tabular-nums">{board.displayOrder}</TableCell>
                    <TableCell>
                      <ActiveToggle
                        entity="board"
                        id={board.id}
                        isActive={board.isActive}
                        label={board.name}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ResourceDialog
                          trigger={<EditButton />}
                          title={`Edit ${board.name}`}
                        >
                          <BoardForm board={board}/>
                        </ResourceDialog>

                        <DeleteResourceDialog
                          entity="board"
                          id={board.id}
                                                    title={`Delete ${board.name}?`}
                          confirmLabel="Delete board"
                          description={
                            <>
                              This permanently deletes the board and everything beneath
                              it: <strong>{board._count.classes} class(es)</strong> and{' '}
                              <strong>{board._count.streams} stream(s)</strong>, plus all
                              their subjects, chapters, notes, PYQs and quizzes. This
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
