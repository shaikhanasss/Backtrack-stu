'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { TextField, TextareaField, SelectField, SwitchField } from '@/components/admin/form-fields';
import { SlugField } from '@/components/admin/slug-field';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import {
  FileUploadField, MultiImageUploadField, type UploadedFile,
} from '@/components/admin/file-upload';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { noteSchema, type NoteInput } from '@/lib/validators/admin';
import { createNote, updateNote } from '@/server/actions/admin/content';
import type { FormOptions } from '@/server/admin-queries';
import { chapterLabel } from '@/lib/admin/labels';
import { Separator } from '@/components/ui/separator';

export interface NoteFormValue {
  id: string;
  chapterId: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  isPremium: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  pdfFile: UploadedFile | null;
  thumbnailFile: UploadedFile | null;
  images: UploadedFile[];
}

export function NoteForm({
  note, options,
}: {
  note?: NoteFormValue;
  options: FormOptions;
}) {
  const close = useResourceDialogClose();

  const [pdf, setPdf] = useState<UploadedFile | null>(note?.pdfFile ?? null);
  const [thumbnail, setThumbnail] = useState<UploadedFile | null>(note?.thumbnailFile ?? null);
  const [images, setImages] = useState<UploadedFile[]>(note?.images ?? []);

  const form = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      chapterId: note?.chapterId ?? '',
      title: note?.title ?? '',
      slug: note?.slug ?? '',
      summary: note?.summary ?? '',
      content: note?.content ?? '',
      pdfFileId: note?.pdfFile?.id ?? null,
      thumbnailFileId: note?.thumbnailFile?.id ?? null,
      imageFileIds: note?.images.map((i) => i.id) ?? [],
      isPremium: note?.isPremium ?? false,
      status: note?.status ?? 'DRAFT',
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: note ? 'Study material updated' : 'Study material created',
    onDone: close,
  });

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() => (note ? updateNote(note.id, values) : createNote(values)))
        )}
      >
        <SelectField
          control={form.control}
          name="chapterId"
          label="Chapter"
          description="Selecting a chapter fixes the board, class, stream and subject."
          options={options.chapters.map((c) => ({ value: c.id, label: chapterLabel(c, options) }))}
        />

        <TextField
          control={form.control}
          name="title"
          label="Title"
          placeholder="Quadratic Equations — Notes"
        />
        <SlugField form={form} name="slug" sourceName="title" placeholder="notes" />

        <TextareaField
          control={form.control}
          name="summary"
          label="Description"
          rows={2}
          placeholder="Concise revision notes covering..."
        />

        <TextareaField
          control={form.control}
          name="content"
          label="Text notes"
          rows={8}
          description="Markdown is supported. Leave blank if the material is PDF-only."
        />

        <Separator />

        <FileUploadField
          kind="PDF"
          label="PDF"
          value={pdf}
          onChange={(file) => {
            setPdf(file);
            form.setValue('pdfFileId', file?.id ?? null);
          }}
        />

        <FileUploadField
          kind="IMAGE"
          label="Thumbnail"
          description="Cover image shown in listings."
          value={thumbnail}
          onChange={(file) => {
            setThumbnail(file);
            form.setValue('thumbnailFileId', file?.id ?? null);
          }}
        />

        <MultiImageUploadField
          label="Add an image"
          values={images}
          onChange={(files) => {
            setImages(files);
            form.setValue('imageFileIds', files.map((f) => f.id));
          }}
        />

        <Separator />

        <div className="grid gap-5 sm:grid-cols-2">
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
        </div>

        <SwitchField
          control={form.control}
          name="isPremium"
          label="Premium"
          description="Reserved for a future paid tier. Has no effect today."
        />

        <FormActions
          isPending={isPending}
          onCancel={close}
          submitLabel={note ? 'Save changes' : 'Create material'}
        />
      </form>
    </Form>
  );
}
