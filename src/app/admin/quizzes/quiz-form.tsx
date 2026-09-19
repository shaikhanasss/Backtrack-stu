'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { TextField, NumberField, TextareaField, SelectField } from '@/components/admin/form-fields';
import { SlugField } from '@/components/admin/slug-field';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { quizSchema, type QuizInput } from '@/lib/validators/admin';
import { createQuiz, updateQuiz } from '@/server/actions/admin/quiz';
import { subjectLabel } from '@/lib/admin/labels';
import type { FormOptions } from '@/server/admin-queries';

export interface QuizFormValue {
  id: string;
  subjectId: string;
  chapterId: string | null;
  title: string;
  slug: string;
  description: string | null;
  durationMin: number;
  passingScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export function QuizForm({
  quiz, options,
}: {
  quiz?: QuizFormValue;
  options: FormOptions;
}) {
  const close = useResourceDialogClose();

  const form = useForm<QuizInput>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      subjectId: quiz?.subjectId ?? '',
      chapterId: quiz?.chapterId ?? null,
      title: quiz?.title ?? '',
      slug: quiz?.slug ?? '',
      description: quiz?.description ?? '',
      durationMin: quiz?.durationMin ?? 10,
      passingScore: quiz?.passingScore ?? 40,
      status: quiz?.status ?? 'DRAFT',
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: quiz ? 'Quiz updated' : 'Quiz created',
    onDone: close,
  });

  const subjectId = form.watch('subjectId');
  const chapterOptions = options.chapters.filter((c) => c.subjectId === subjectId);

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() => (quiz ? updateQuiz(quiz.id, values) : createQuiz(values)))
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
          label="Chapter"
          allowNone
          noneLabel="Whole subject"
          disabled={!subjectId}
          description="Leave as whole subject for a mixed revision quiz."
          options={chapterOptions.map((c) => ({ value: c.id, label: `${c.number}. ${c.title}` }))}
        />

        <TextField
          control={form.control}
          name="title"
          label="Title"
          placeholder="Quadratic Equations — Practice Quiz"
        />
        <SlugField form={form} name="slug" sourceName="title" placeholder="quadratic-equations-practice" />
        <TextareaField control={form.control} name="description" label="Description" rows={3} />

        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            control={form.control}
            name="durationMin"
            label="Duration (minutes)"
            min={1}
            max={300}
          />
          <NumberField
            control={form.control}
            name="passingScore"
            label="Passing score (%)"
            min={0}
            max={100}
          />
        </div>

        <SelectField
          control={form.control}
          name="status"
          label="Status"
          description="A quiz cannot be published until it has at least one question."
          options={[
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
        />

        <FormActions
          isPending={isPending}
          onCancel={close}
          submitLabel={quiz ? 'Save changes' : 'Create quiz'}
        />
      </form>
    </Form>
  );
}
