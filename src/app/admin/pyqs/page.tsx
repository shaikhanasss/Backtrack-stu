import type { Metadata } from 'next';
import { Plus, FileText } from 'lucide-react';

import { listPyqs, getFormOptions, getPyqYears } from '@/server/admin-queries';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PyqForm } from '@/app/admin/pyqs/pyq-form';
import { subjectLabel } from '@/lib/admin/labels';

export const metadata: Metadata = { title: 'PYQs' };

const SORTS = [
  { value: 'year', label: 'Year' },
  { value: 'title', label: 'Title' },
  { value: 'createdAt', label: 'Created' },
];

export default async function AdminPyqsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, {
    defaultSort: 'year',
    defaultDir: 'desc',
    allowedSorts: SORTS.map((s) => s.value),
    filterKeys: ['subjectId', 'year', 'status'],
  });

  const [{ rows, total, page, pageSize, pageCount }, options, years] = await Promise.all([
    listPyqs(params),
    getFormOptions(),
    getPyqYears(),
  ]);

  return (
    <AdminPageShell
      title="Previous Year Questions"
      description="Board question papers with optional solutions."
      action={
        <ResourceDialog
          trigger={<Button><Plus size={16} /> New paper</Button>}
          title="Add question paper"
          className="max-w-2xl"
        >
          <PyqForm options={options}/>
        </ResourceDialog>
      }
      toolbar={
        <AdminToolbar
          searchPlaceholder="Search papers..."
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
              key: 'year',
              label: 'Years',
              options: years.map((y) => ({ value: String(y), label: String(y) })),
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
          icon="📝"
          title={params.q ? `No papers match "${params.q}"` : 'No question papers yet'}
          description="Add a paper against a subject and upload the PDF."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paper</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((pyq) => (
                  <TableRow key={pyq.id}>
                    <TableCell>
                      <div className="font-medium text-white">{pyq.title}</div>
                      {pyq.chapter ? (
                        <div className="text-xs text-white/50">
                          Chapter {pyq.chapter.number}: {pyq.chapter.title}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {pyq.subject.class.board.name} · {pyq.subject.name}
                    </TableCell>
                    <TableCell><Badge variant="muted">{pyq.year}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-white/60">
                        {pyq.questionFile ? (
                          <a
                            href={`/api/files/${pyq.questionFile.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-brand-gold"
                          >
                            <FileText size={13} /> Paper
                          </a>
                        ) : (
                          <span className="text-white/30">No paper</span>
                        )}
                        {pyq.solutionFile ? (
                          <a
                            href={`/api/files/${pyq.solutionFile.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-brand-gold"
                          >
                            <FileText size={13} /> Solution
                          </a>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PublishToggle
                        entity="pyq"
                        id={pyq.id}
                        status={pyq.status}
                        label={pyq.title}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ResourceDialog
                          trigger={<EditButton />}
                          title={`Edit ${pyq.title}`}
                          className="max-w-2xl"
                        >
                          <PyqForm
                              pyq={{
                                id: pyq.id,
                                subjectId: pyq.subjectId,
                                chapterId: pyq.chapterId,
                                title: pyq.title,
                                year: pyq.year,
                                examSession: pyq.examSession,
                                description: pyq.description,
                                status: pyq.status,
                                questionFile: pyq.questionFile,
                                solutionFile: pyq.solutionFile,
                              }}
                              options={options}/>
                        </ResourceDialog>
                        <DeleteResourceDialog
                          entity="pyq"
                          id={pyq.id}
                                                    title={`Delete ${pyq.title}?`}
                          confirmLabel="Delete paper"
                          description="The paper record will be permanently deleted. Uploaded PDFs are kept and can be reused."
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
