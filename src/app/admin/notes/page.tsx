import type { Metadata } from 'next';
import { Plus, FileText, ImageIcon } from 'lucide-react';

import { listNotes, getFormOptions } from '@/server/admin-queries';
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
import { NoteForm } from '@/app/admin/notes/note-form';
import { subjectLabel } from '@/lib/admin/labels';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Study Material' };

const SORTS = [
  { value: 'createdAt', label: 'Created' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
];

export default async function AdminNotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, {
    defaultSort: 'createdAt',
    defaultDir: 'desc',
    allowedSorts: SORTS.map((s) => s.value),
    filterKeys: ['subjectId', 'chapterId', 'status'],
  });

  const [{ rows, total, page, pageSize, pageCount }, options] = await Promise.all([
    listNotes(params),
    getFormOptions(),
  ]);

  return (
    <AdminPageShell
      title="Study Material"
      description="Text notes, PDFs and images, filed against a chapter."
      action={
        <ResourceDialog
          trigger={<Button><Plus size={16} /> New material</Button>}
          title="Create study material"
          className="max-w-2xl"
        >
          <NoteForm options={options}/>
        </ResourceDialog>
      }
      toolbar={
        <AdminToolbar
          searchPlaceholder="Search titles and descriptions..."
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
          icon="📚"
          title={params.q ? `No material matches "${params.q}"` : 'No study material yet'}
          description="Create material against a chapter. You can attach a PDF, a thumbnail and images."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>
                      <div className="font-medium text-white">{note.title}</div>
                      {note.summary ? (
                        <div className="mt-0.5 max-w-sm truncate text-xs text-white/50">
                          {note.summary}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {note.chapter.subject.class.board.name} · {note.chapter.subject.name} ·{' '}
                      {note.chapter.number}. {note.chapter.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-white/60">
                        {note.pdfFile ? (
                          <a
                            href={`/api/files/${note.pdfFile.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-brand-gold"
                          >
                            <FileText size={13} /> PDF
                          </a>
                        ) : null}
                        {note._count.images > 0 ? (
                          <span className="flex items-center gap-1">
                            <ImageIcon size={13} /> {note._count.images}
                          </span>
                        ) : null}
                        {note.content ? <span>Text</span> : null}
                        {!note.pdfFile && note._count.images === 0 && !note.content ? (
                          <span className="text-white/30">None</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-white/65">
                      {formatDate(note.createdAt)}
                    </TableCell>
                    <TableCell>
                      <PublishToggle
                        entity="note"
                        id={note.id}
                        status={note.status}
                        label={note.title}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ResourceDialog
                          trigger={<EditButton />}
                          title={`Edit ${note.title}`}
                          className="max-w-2xl"
                        >
                          <NoteForm
                              note={{
                                id: note.id,
                                chapterId: note.chapterId,
                                title: note.title,
                                slug: note.slug,
                                summary: note.summary,
                                content: note.content,
                                isPremium: note.isPremium,
                                status: note.status,
                                pdfFile: note.pdfFile,
                                thumbnailFile: note.thumbnailFile,
                                images: note.images.map((i) => i.file),
                              }}
                              options={options}/>
                        </ResourceDialog>
                        <DeleteResourceDialog
                          entity="note"
                          id={note.id}
                                                    title={`Delete ${note.title}?`}
                          confirmLabel="Delete material"
                          description="The material and its student progress records will be permanently deleted. Uploaded files are kept and can be reused."
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
