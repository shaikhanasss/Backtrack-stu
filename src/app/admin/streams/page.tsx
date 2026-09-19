import type { Metadata } from 'next';
import { Plus } from 'lucide-react';

import { listStreams, getFormOptions } from '@/server/admin-queries';
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
import { StreamForm } from '@/app/admin/streams/stream-form';

export const metadata: Metadata = { title: 'Streams' };

const SORTS = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created' },
];

export default async function AdminStreamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, {
    defaultSort: 'name',
    allowedSorts: SORTS.map((s) => s.value),
    filterKeys: ['boardId', 'status'],
  });

  const [{ rows, total, page, pageSize, pageCount }, options] = await Promise.all([
    listStreams(params),
    getFormOptions(),
  ]);

  return (
    <AdminPageShell
      title="Streams"
      description="Science, Commerce and Arts. Optional by design — SSC has no streams."
      action={
        <ResourceDialog trigger={<Button><Plus size={16} /> New stream</Button>} title="Create stream">
          <StreamForm options={options}/>
        </ResourceDialog>
      }
      toolbar={
        <AdminToolbar
          searchPlaceholder="Search streams..."
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
          icon="🔬"
          title={params.q ? `No streams match "${params.q}"` : 'No streams yet'}
          description="Streams apply to HSC only. SSC subjects simply leave the stream unset."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stream</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Subjects</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((stream) => (
                  <TableRow key={stream.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium text-white">
                        <span aria-hidden="true">{stream.icon ?? '🎯'}</span>
                        {stream.name}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="muted">{stream.board.name}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-white/60">{stream.slug}</TableCell>
                    <TableCell className="text-right tabular-nums">{stream._count.subjects}</TableCell>
                    <TableCell>
                      <ActiveToggle
                        entity="stream"
                        id={stream.id}
                        isActive={stream.isActive}
                        label={stream.name}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ResourceDialog trigger={<EditButton />} title={`Edit ${stream.name}`}>
                          <StreamForm stream={stream} options={options}/>
                        </ResourceDialog>
                        <DeleteResourceDialog
                          entity="stream"
                          id={stream.id}
                                                    title={`Delete ${stream.name}?`}
                          confirmLabel="Delete stream"
                          description={
                            <>
                              Its <strong>{stream._count.subjects} subject(s)</strong> are not
                              deleted — they become stream-less (common to all streams). This
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
