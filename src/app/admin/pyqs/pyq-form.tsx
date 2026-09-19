'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { TextField, NumberField, TextareaField, SelectField } from '@/components/admin/form-fields';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import { FileUploadField, type UploadedFile } from '@/components/admin/file-upload';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { pyqSchema, type PyqInput } from '@/lib/validators/admin';
import { createPyq, updatePyq } from '@/server/actions/admin/content';
import { subjectLabel } from '@/lib/admin/labels';
import type { FormOptions } from '@/server/admin-queries';
import { Separator } from '@/components/ui/separator';

export interface PyqFormValue {
  id: string;
  subjectId: string;
  chapterId: string | null;
  title: string;
  year: number;
  examSession: string | null;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  questionFile: UploadedFile | null;
  solutionFile: UploadedFile | null;
}

export function PyqForm({
  pyq, options,
}: {
  pyq?: PyqFormValue;
  options: FormOptions;
}) {
  const close = useResourceDialogClose();

  const [question, setQuestion] = useState<UploadedFile | null>(pyq?.questionFile ?? null);
  const [solution, setSolution] = useState<UploadedFile | null>(pyq?.solutionFile ?? null);

  const form = useForm<PyqInput>({
    resolver: zodResolver(pyqSchema),
    defaultValues: {
      subjectId: pyq?.subjectId ?? '',
      chapterId: pyq?.chapterId ?? null,
      title: pyq?.title ?? '',
      year: pyq?.year ?? new Date().getFullYear(),
      examSession: pyq?.examSession ?? '',
      description: pyq?.description ?? '',
      questionFileId: pyq?.questionFile?.id ?? null,
      solutionFileId: pyq?.solutionFile?.id ?? null,
      status: pyq?.status ?? 'DRAFT',
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: pyq ? 'Question paper updated' : 'Question paper created',
    onDone: close,
  });

  // A paper may optionally map to one chapter, but only within its own subject.
  const subjectId = form.watch('subjectId');
  const chapterOptions = options.chapters.filter((c) => c.subjectId === subjectId);

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() => (pyq ? updatePyq(pyq.id, values) : createPyq(values)))
        )}
      >
        <SelectField
          control={form.control}
          name="subjectId"
          label="Subject"
          options={options.subjects.map((s) => ({ value: s.id, label: subjectLabel(s, options) }))}
          onChanged={() => form.setValue('chapterId', null)}
        />

        <SelectField
          control={form.control}
          name="chapterId"
          label="Chapter / topic"
          allowNone
          noneLabel="Whole subject"
          disabled={!subjectId}
          description="Optional. Most board papers cover the whole subject."
          options={chapterOptions.map((c) => ({
            value: c.id,
            label: `${c.number}. ${c.title}`,
          }))}
        />

        <TextField
          control={form.control}
          name="title"
          label="Title"
          placeholder="Mathematics Part I — March 2024"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField control={form.control} name="year" label="Year" min={1990} />
          <TextField
            control={form.control}
            name="examSession"
            label="Exam session"
            placeholder="March 2024 Board Examination"
          />
        </div>

        <TextareaField control={form.control} name="description" label="Description" rows={3} />

        <Separator />

        <FileUploadField
          kind="PDF"
          label="Question paper (PDF)"
          value={question}
          onChange={(file) => {
            setQuestion(file);
            form.setValue('questionFileId', file?.id ?? null);
          }}
        />

        <FileUploadField
          kind="PDF"
          label="Solution paper (PDF)"
          description="Optional."
          value={solution}
          onChange={(file) => {
            setSolution(file);
            form.setValue('solutionFileId', file?.id ?? null);
          }}
        />

        <Separator />

        <SelectField
          control={form.control}
          name="status"
          label="Status"
          options={[
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
        />

        <FormActions
          isPending={isPending}
          onCancel={close}
          submitLabel={pyq ? 'Save changes' : 'Create paper'}
        />
      </form>
    </Form>
  );
}
