'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Difficulty } from '@prisma/client';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { TextareaField, NumberField, SelectField } from '@/components/admin/form-fields';
import { FormActions } from '@/components/admin/form-shell';
import { useResourceDialogClose } from '@/components/admin/resource-dialog';
import { Input } from '@/components/ui/input';
import { useEntitySubmit } from '@/lib/admin/use-entity-form';
import { quizQuestionSchema, type QuizQuestionInput } from '@/lib/validators/admin';
import { createQuizQuestion, updateQuizQuestion } from '@/server/actions/admin/quiz';
import { cn } from '@/lib/utils';

export interface QuestionValue {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  difficulty: Difficulty;
  marks: number;
  displayOrder: number;
}

const LETTERS = ['A', 'B', 'C', 'D'];

export function QuestionForm({
  quizId, question, nextOrder,
}: {
  quizId: string;
  question?: QuestionValue;
  nextOrder: number;
}) {
  const close = useResourceDialogClose();

  const form = useForm<QuizQuestionInput>({
    resolver: zodResolver(quizQuestionSchema),
    defaultValues: {
      quizId,
      text: question?.text ?? '',
      options: question?.options ?? ['', '', '', ''],
      correctIndex: question?.correctIndex ?? 0,
      explanation: question?.explanation ?? '',
      difficulty: question?.difficulty ?? 'MEDIUM',
      marks: question?.marks ?? 1,
      displayOrder: question?.displayOrder ?? nextOrder,
    },
  });

  const { isPending, submit } = useEntitySubmit(form, {
    successMessage: question ? 'Question updated' : 'Question added',
    onDone: close,
  });

  const correctIndex = Number(form.watch('correctIndex'));

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) =>
          submit(() =>
            question ? updateQuizQuestion(question.id, values) : createQuizQuestion(values)
          )
        )}
      >
        <TextareaField
          control={form.control}
          name="text"
          label="Question"
          rows={3}
          placeholder="The standard form of a quadratic equation is:"
        />

        {/* Four options, with the correct one chosen by radio so exactly one
            can ever be selected. */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-white/90">
            Options — select the correct answer
          </div>

          {[0, 1, 2, 3].map((index) => (
            <FormField
              key={index}
              control={form.control}
              name={`options.${index}` as const}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <label
                      className={cn(
                        'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border text-sm font-bold transition-colors',
                        correctIndex === index
                          ? 'border-brand-gold bg-brand-gold text-brand-navy'
                          : 'border-white/25 text-white/70 hover:border-white/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="correctIndex"
                        className="sr-only"
                        checked={correctIndex === index}
                        onChange={() => form.setValue('correctIndex', index)}
                        aria-label={`Mark option ${LETTERS[index]} as correct`}
                      />
                      {LETTERS[index]}
                    </label>
                    <FormControl>
                      <Input
                        placeholder={`Option ${LETTERS[index]}`}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="correctIndex"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <TextareaField
          control={form.control}
          name="explanation"
          label="Explanation"
          rows={2}
          description="Shown to the student after they answer."
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField
            control={form.control}
            name="difficulty"
            label="Difficulty"
            options={[
              { value: 'EASY', label: 'Easy' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HARD', label: 'Hard' },
            ]}
          />
          <NumberField control={form.control} name="marks" label="Marks" min={1} max={100} />
          <NumberField control={form.control} name="displayOrder" label="Order" min={0} />
        </div>

        <FormActions
          isPending={isPending}
          onCancel={close}
          submitLabel={question ? 'Save question' : 'Add question'}
        />
      </form>
    </Form>
  );
}

export { LETTERS };
