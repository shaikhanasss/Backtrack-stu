'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { startQuizAttempt } from '@/server/actions/student';

export function StartQuizButton({
  quizId,
  hasAttempts,
}: {
  quizId: string;
  hasAttempts: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="lg"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await startQuizAttempt(quizId);
          if (!result.ok || !result.attemptId) {
            toast.error(result.ok ? 'Could not start the quiz.' : result.message);
            return;
          }
          router.push(`/dashboard/quiz/${quizId}/attempt/${result.attemptId}`);
        })
      }
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Play />}
      {isPending ? 'Starting...' : hasAttempts ? 'Take again' : 'Start quiz'}
    </Button>
  );
}
