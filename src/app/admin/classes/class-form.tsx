'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { TextField, NumberField, SelectField, SwitchField } from '@/components/admin/form-fields';
import { SlugField } from '@/components/admin/slug-field';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { classSchema, type ClassInput } from '@/lib/validators/admin';
import { createClass, updateClass } from '@/server/actions/admin/hierarchy';
import type { FormOptions } from '@/server/admin-queries';

export interface ClassRow {
  id: string;
  boardId: string;
  level: number;
  name: string;
  slug: string;
  isActive: boolean;
}

export function ClassForm({
  klass, options,
}: {
  klass?: ClassRow;
  options: FormOptions;
}) {
  const close = useResourceDialogClose();

  const form = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      boardId: klass?.boardId ?? '',
      level: klass?.level ?? 10,
      name: klass?.name ?? '',
      slug: klass?.slug ?? '',
      isActive: klass?.isActive ?? true,
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: klass ? 'Class updated' : 'Class created',
    onDone: close,
  });

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() => (klass ? updateClass(klass.id, values) : createClass(values)))
        )}
      >
        <SelectField
          control={form.control}
          name="boardId"
          label="Board"
          options={options.boards.map((b) => ({ value: b.id, label: b.name }))}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Class name" placeholder="Class 10" />
          <NumberField
            control={form.control}
            name="level"
            label="Level"
            min={1}
            max={12}
            description="Numeric year: 10, 11 or 12."
          />
        </div>
        <SlugField form={form} name="slug" sourceName="name" placeholder="class-10" />
        <SwitchField control={form.control} name="isActive" label="Active" />

        <FormActions isPending={isPending} onCancel={close} submitLabel={klass ? 'Save changes' : 'Create class'} />
      </form>
    </Form>
  );
}
