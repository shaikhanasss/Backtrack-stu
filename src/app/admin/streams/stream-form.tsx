'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { TextField, TextareaField, SelectField, SwitchField } from '@/components/admin/form-fields';
import { SlugField } from '@/components/admin/slug-field';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { streamSchema, type StreamInput } from '@/lib/validators/admin';
import { createStream, updateStream } from '@/server/actions/admin/hierarchy';
import type { FormOptions } from '@/server/admin-queries';

export interface StreamRow {
  id: string;
  boardId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

export function StreamForm({
  stream, options,
}: {
  stream?: StreamRow;
  options: FormOptions;
}) {
  const close = useResourceDialogClose();

  const form = useForm<StreamInput>({
    resolver: zodResolver(streamSchema),
    defaultValues: {
      boardId: stream?.boardId ?? '',
      name: stream?.name ?? '',
      slug: stream?.slug ?? '',
      description: stream?.description ?? '',
      icon: stream?.icon ?? '',
      isActive: stream?.isActive ?? true,
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: stream ? 'Stream updated' : 'Stream created',
    onDone: close,
  });

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() => (stream ? updateStream(stream.id, values) : createStream(values)))
        )}
      >
        <SelectField
          control={form.control}
          name="boardId"
          label="Board"
          description="Streams normally belong to HSC. SSC has none, which is why the field is optional on subjects."
          options={options.boards.map((b) => ({ value: b.id, label: b.name }))}
        />
        <TextField control={form.control} name="name" label="Stream name" placeholder="Science" />
        <SlugField form={form} name="slug" sourceName="name" placeholder="science" />
        <TextareaField control={form.control} name="description" label="Description" rows={3} />
        <TextField control={form.control} name="icon" label="Icon (emoji)" placeholder="🔬" />
        <SwitchField control={form.control} name="isActive" label="Active" />

        <FormActions isPending={isPending} onCancel={close} submitLabel={stream ? 'Save changes' : 'Create stream'} />
      </form>
    </Form>
  );
}
