'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { submitQuizAttempt } from '@/server/actions/student';
import { cn, percentage } from '@/lib/utils';

const LETTERS = ['A', 'B', 'C', 'D'];

export interface PlayableQuestion {
  id: string;
  text: string;
  options: string[];
  marks: number;
  difficulty: string;
}

/**
 * The quiz engine.
 *
 * Answers live in component state and are submitted in one call. Nothing here
 * knows which option is correct — `correctIndex` is never sent to the browser
 * during an attempt, so the answer key cannot be read out of devtools. Scoring
 * happens server-side in `submitQuizAttempt`.
 */
export function QuizPlayer({
  attemptId,
  title,
  questions,
  durationMin,
  startedAt,
  initialAnswers,
}: {
  attemptId: string;
  title: string;
  questions: PlayableQuestion[];
  durationMin: number;
  startedAt: string;
  initialAnswers: Record<string, number>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const deadline = useMemo(
    () => new Date(startedAt).getTime() + durationMin * 60_000,
    [startedAt, durationMin]
  );

  // Seeded with the full duration rather than `deadline - Date.now()`: the
  // latter evaluates during the server render AND again on the client, giving
  // two different numbers and a hydration mismatch. The real remaining time is
  // set by the effect below, on the first tick after mount.
  const [remaining, setRemaining] = useState(durationMin * 60_000);

  const question = questions[index];
  const answeredCount = Object.keys(answers).length;

  const submit = useCallback(
    (auto = false) => {
      startTransition(async () => {
        const result = await submitQuizAttempt(attemptId, answers);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(auto ? 'Time is up — quiz submitted' : 'Quiz submitted');
        router.replace(`/dashboard/quiz/result/${attemptId}`);
      });
    },
    [attemptId, answers, router]
  );

  // Countdown. When it reaches zero the attempt is submitted automatically so
  // an abandoned quiz still records a score rather than hanging open forever.
  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      return left;
    };

    // Correct the seeded value immediately, then keep it ticking.
    if (tick() === 0) {
      submit(true);
      return;
    }

    const timer = setInterval(() => {
      if (tick() === 0) {
        clearInterval(timer);
        submit(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, submit]);

  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const lowTime = remaining < 60_000;

  function choose(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  }

  return (
    <div className="space-y-6">
      {/* Header: progress and timer */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-white sm:text-2xl">{title}</h1>
          <p className="text-sm text-white/55">
            Question {index + 1} of {questions.length} · {answeredCount} answered
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 rounded-pill px-4 py-2 font-mono text-lg font-bold tabular-nums',
            lowTime ? 'bg-destructive/20 text-destructive' : 'bg-white/10 text-white'
          )}
          aria-live="polite"
          aria-label="Time remaining"
        >
          <Clock size={16} />
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <Progress value={percentage(answeredCount, questions.length)} />

      {/* Question navigator — jump straight to any question */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to question ${i + 1}${answered ? ', answered' : ''}`}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'size-9 rounded-full text-sm font-semibold transition-colors',
                i === index
                  ? 'bg-brand-gold text-brand-navy'
                  : answered
                    ? 'bg-white/25 text-white'
                    : 'bg-white/10 text-white/55 hover:bg-white/20'
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-lg font-medium text-white">{question.text}</p>
            <div className="flex shrink-0 gap-2">
              <Badge variant="outline">{question.difficulty}</Badge>
              <Badge variant="muted">
                {question.marks} mark{question.marks === 1 ? '' : 's'}
              </Badge>
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((option, optionIndex) => {
              const selected = answers[question.id] === optionIndex;
              return (
                <label
                  key={optionIndex}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors',
                    selected
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-white/12 bg-white/5 hover:border-white/30'
                  )}
                >
                  <input
                    type="radio"
                    name={question.id}
                    className="sr-only"
                    checked={selected}
                    onChange={() => choose(optionIndex)}
                  />
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      selected ? 'bg-brand-gold text-brand-navy' : 'bg-white/12 text-white/70'
                    )}
                  >
                    {LETTERS[optionIndex]}
                  </span>
                  <span className="text-white/90">{option}</span>
                </label>
              );
            })}
          </fieldset>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft size={16} /> Previous
        </Button>

        {index === questions.length - 1 ? (
          <Button onClick={() => setConfirmOpen(true)} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Send size={16} />}
            Submit quiz
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            Next <ChevronRight size={16} />
          </Button>
        )}
      </div>

      {index !== questions.length - 1 ? (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} disabled={isPending}>
            Submit early
          </Button>
        </div>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length
                ? ' Unanswered questions score zero.'
                : ''}{' '}
              You cannot change your answers after submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Keep going</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                submit();
              }}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
