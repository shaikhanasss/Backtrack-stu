'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { TextField, NumberField, TextareaField, SwitchField } from '@/components/admin/form-fields';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { boardSchema, type BoardInput } from '@/lib/validators/admin';
import { createBoard, updateBoard } from '@/server/actions/admin/hierarchy';
import { slugify } from '@/lib/utils';

export interface BoardRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
}

export function BoardForm({ board }: { board?: BoardRow }) {
  const close = useResourceDialogClose();

  const form = useForm<BoardInput>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: board?.name ?? '',
      slug: board?.slug ?? '',
      description: board?.description ?? '',
      icon: board?.icon ?? '',
      displayOrder: board?.displayOrder ?? 0,
      isActive: board?.isActive ?? true,
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: board ? 'Board updated' : 'Board created',
    onDone: close,
  });

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() => (board ? updateBoard(board.id, values) : createBoard(values)))
        )}
      >
        <TextField control={form.control} name="name" label="Board name" placeholder="SSC" />

        <div className="space-y-1">
          <TextField
            control={form.control}
            name="slug"
            label="Slug"
            placeholder="ssc"
            description="Used in URLs. Lowercase letters, numbers and hyphens."
          />
          <button
            type="button"
            className="text-xs text-brand-gold underline"
            onClick={() => form.setValue('slug', slugify(form.getValues('name') || ''))}
          >
            Generate from name
          </button>
        </div>
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          rows={3}
          placeholder="Maharashtra State Board — Secondary School Certificate"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="icon" label="Icon (emoji)" placeholder="📚" />
          <NumberField control={form.control} name="displayOrder" label="Display order" min={0} />
        </div>
        <SwitchField
          control={form.control}
          name="isActive"
          label="Active"
          description="Inactive boards are hidden from students but keep all their content."
        />

        <FormActions isPending={isPending} onCancel={close} submitLabel={board ? 'Save changes' : 'Create board'} />
      </form>
    </Form>
  );
}
