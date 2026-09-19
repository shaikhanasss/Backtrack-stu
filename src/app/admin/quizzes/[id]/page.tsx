import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';

import { getQuizWithQuestions } from '@/server/admin-queries';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { ResourceDialog } from '@/components/admin/resource-dialog';
import { DeleteResourceDialog } from '@/components/admin/delete-dialog';
import { PublishToggle } from '@/components/admin/status-controls';
import { EditButton } from '@/components/admin/row-actions';
import { EmptyState } from '@/components/brand/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { QuestionForm, LETTERS } from '@/app/admin/quizzes/[id]/question-form';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Quiz Builder' };

export default async function QuizBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuizWithQuestions(id);

  if (!quiz) notFound();

  const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <AdminPageShell
      title={quiz.title}
      description={`${quiz.subject.class.board.name} · ${quiz.subject.name} · ${
        quiz.chapter ? `Chapter ${quiz.chapter.number}: ${quiz.chapter.title}` : 'Whole subject'
      }`}
      action={
        <div className="flex flex-wrap items-center gap-3">
          <PublishToggle
            entity="quiz"
            id={quiz.id}
            status={quiz.status}
            label={quiz.title}
          />
          <ResourceDialog
            trigger={<Button><Plus size={16} /> Add question</Button>}
            title="Add question"
            className="max-w-2xl"
          >
            <QuestionForm
                quizId={quiz.id}
                nextOrder={quiz.questions.length + 1}/>
          </ResourceDialog>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/quizzes">
            <ArrowLeft size={14} /> All quizzes
          </Link>
        </Button>
        <Badge variant="muted">{quiz.questions.length} questions</Badge>
        <Badge variant="muted">{totalMarks} marks</Badge>
        <Badge variant="muted">{quiz.durationMin} min</Badge>
        <Badge variant="muted">Pass at {quiz.passingScore}%</Badge>
        <Badge variant="muted">{quiz._count.attempts} attempts</Badge>
      </div>

      {quiz.questions.length === 0 ? (
        <EmptyState
          icon="❓"
          title="No questions yet"
          description="Add at least one question before publishing. A published quiz with no questions would show students an empty test, so that transition is blocked."
        />
      ) : (
        <div className="space-y-4">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span>Q{index + 1}</span>
                      <Badge variant="outline">{question.difficulty}</Badge>
                      <span>{question.marks} mark{question.marks === 1 ? '' : 's'}</span>
                    </div>
                    <p className="mt-2 font-medium text-white">{question.text}</p>
                  </div>

                  <div className="flex gap-2">
                    <ResourceDialog
                      trigger={<EditButton />}
                      title={`Edit question ${index + 1}`}
                      className="max-w-2xl"
                    >
                      <QuestionForm
                          quizId={quiz.id}
                          question={question}
                          nextOrder={question.displayOrder}/>
                    </ResourceDialog>
                    <DeleteResourceDialog
                      entity="question"
                      id={question.id}
                                            title={`Delete question ${index + 1}?`}
                      confirmLabel="Delete question"
                      description="This question will be permanently removed from the quiz. If it is the last one, the quiz is moved back to draft."
                    />
                  </div>
                </div>

                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === question.correctIndex;
                    return (
                      <li
                        key={optionIndex}
                        className={cn(
                          'flex items-start gap-2 rounded-xl border p-3 text-sm',
                          isCorrect
                            ? 'border-brand-gold/50 bg-brand-gold/10 text-white'
                            : 'border-white/10 bg-white/5 text-white/75'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            isCorrect ? 'bg-brand-gold text-brand-navy' : 'bg-white/10 text-white/60'
                          )}
                        >
                          {LETTERS[optionIndex]}
                        </span>
                        {option}
                      </li>
                    );
                  })}
                </ul>

                {question.explanation ? (
                  <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-white/70">
                    <span className="font-semibold text-brand-gold">Explanation: </span>
                    {question.explanation}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
