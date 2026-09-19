'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { TextField, NumberField, TextareaField, SelectField, SwitchField } from '@/components/admin/form-fields';
import { SlugField } from '@/components/admin/slug-field';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { subjectSchema, type SubjectInput } from '@/lib/validators/admin';
import { createSubject, updateSubject } from '@/server/actions/admin/hierarchy';
import type { FormOptions } from '@/server/admin-queries';

export interface SubjectRow {
  id: string;
  classId: string;
  streamId: string | null;
  name: string;
  slug: string;
  code: string | null;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
}

export function SubjectForm({
  subject, options,
}: {
  subject?: SubjectRow;
  options: FormOptions;
}) {
  const close = useResourceDialogClose();

  const form = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      classId: subject?.classId ?? '',
      streamId: subject?.streamId ?? null,
      name: subject?.name ?? '',
      slug: subject?.slug ?? '',
      code: subject?.code ?? '',
      description: subject?.description ?? '',
      icon: subject?.icon ?? '',
      displayOrder: subject?.displayOrder ?? 0,
      isActive: subject?.isActive ?? true,
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: subject ? 'Subject updated' : 'Subject created',
    onDone: close,
  });

  // Streams are scoped to the board that owns the selected class. A board with
  // no streams (SSC) simply offers none, which is the rule expressed as data.
  const classId = form.watch('classId');
  const selectedClass = options.classes.find((c) => c.id === classId);
  const streamOptions = selectedClass
    ? options.streams.filter((s) => s.boardId === selectedClass.boardId)
    : [];

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() => (subject ? updateSubject(subject.id, values) : createSubject(values)))
        )}
      >
        <SelectField
          control={form.control}
          name="classId"
          label="Class"
          options={options.classes.map((c) => {
            const board = options.boards.find((b) => b.id === c.boardId);
            return { value: c.id, label: `${board?.name ?? '?'} · ${c.name}` };
          })}
          onChanged={() => form.setValue('streamId', null)}
        />

        <SelectField
          control={form.control}
          name="streamId"
          label="Stream"
          allowNone
          noneLabel={
            selectedClass && streamOptions.length === 0
              ? 'Not applicable for this board'
              : 'None — common to all streams'
          }
          disabled={!classId}
          description={
            selectedClass && streamOptions.length === 0
              ? 'This board has no streams, so the subject stays stream-less.'
              : 'Leave as None for subjects taught across every stream, such as English.'
          }
          options={streamOptions.map((s) => ({ value: s.id, label: s.name }))}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Subject name" placeholder="Mathematics" />
          <TextField
            control={form.control}
            name="code"
            label="Subject code"
            placeholder="MATH10"
            description="Optional. Must be unique when set."
          />
        </div>

        <SlugField form={form} name="slug" sourceName="name" placeholder="mathematics" />
        <TextareaField control={form.control} name="description" label="Description" rows={3} />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="icon" label="Icon (emoji)" placeholder="➗" />
          <NumberField control={form.control} name="displayOrder" label="Display order" min={0} />
        </div>

        <SwitchField control={form.control} name="isActive" label="Active" />

        <FormActions isPending={isPending} onCancel={close} submitLabel={subject ? 'Save changes' : 'Create subject'} />
      </form>
    </Form>
  );
}
