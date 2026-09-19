'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { TextField, NumberField, TextareaField, SelectField, SwitchField } from '@/components/admin/form-fields';
import { SlugField } from '@/components/admin/slug-field';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { chapterSchema, type ChapterInput } from '@/lib/validators/admin';
import { createChapter, updateChapter } from '@/server/actions/admin/hierarchy';
import type { FormOptions } from '@/server/admin-queries';
import { subjectLabel } from '@/lib/admin/labels';

export interface ChapterRow {
  id: string;
  subjectId: string;
  number: number;
  title: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export function ChapterForm({
  chapter, options,
}: {
  chapter?: ChapterRow;
  options: FormOptions;
}) {
  const close = useResourceDialogClose();

  const form = useForm<ChapterInput>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      subjectId: chapter?.subjectId ?? '',
      number: chapter?.number ?? 1,
      title: chapter?.title ?? '',
      slug: chapter?.slug ?? '',
      description: chapter?.description ?? '',
      displayOrder: chapter?.displayOrder ?? 0,
      isActive: chapter?.isActive ?? true,
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: chapter ? 'Chapter updated' : 'Chapter created',
    onDone: close,
  });

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() => (chapter ? updateChapter(chapter.id, values) : createChapter(values)))
        )}
      >
        <SelectField
          control={form.control}
          name="subjectId"
          label="Subject"
          options={options.subjects.map((s) => ({ value: s.id, label: subjectLabel(s, options) }))}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            control={form.control}
            name="number"
            label="Chapter number"
            min={1}
            description="The number printed in the textbook."
          />
          <NumberField
            control={form.control}
            name="displayOrder"
            label="Display order"
            min={0}
            description="Ordering in listings, if it differs."
          />
        </div>

        <TextField
          control={form.control}
          name="title"
          label="Chapter title"
          placeholder="Quadratic Equations"
        />
        <SlugField form={form} name="slug" sourceName="title" placeholder="quadratic-equations" />
        <TextareaField control={form.control} name="description" label="Description" rows={3} />
        <SwitchField control={form.control} name="isActive" label="Active" />

        <FormActions isPending={isPending} onCancel={close} submitLabel={chapter ? 'Save changes' : 'Create chapter'} />
      </form>
    </Form>
  );
}
