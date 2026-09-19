'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { recordNoteView, setNoteCompleted } from '@/server/actions/student';

/**
 * Records the view once on mount, then offers the completion toggle.
 *
 * The view is recorded from the client rather than during the server render so
 * a prefetch or a bot fetch does not inflate the count or move `lastReadAt`.
 * The ref guards against React's development double-effect.
 */
export function NoteActions({
  noteId,
  initialCompleted,
}: {
  noteId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    void recordNoteView(noteId);
  }, [noteId]);

  function toggle() {
    const next = !completed;
    setCompleted(next);

    startTransition(async () => {
      const result = await setNoteCompleted(noteId, next);
      if (!result.ok) {
        setCompleted(!next);
        toast.error(result.message);
        return;
      }
      toast.success(next ? 'Marked as completed' : 'Marked as still in progress');
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={isPending}
      variant={completed ? 'outline' : 'default'}
      size="sm"
      aria-pressed={completed}
    >
      {isPending ? (
        <Loader2 className="animate-spin" />
      ) : completed ? (
        <CheckCircle2 />
      ) : (
        <Circle />
      )}
      {completed ? 'Completed' : 'Mark as completed'}
    </Button>
  );
}
