'use client';

import { useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { toggleBookmark } from '@/server/actions/student';
import { cn } from '@/lib/utils';

/**
 * Optimistic bookmark toggle. The button state flips immediately and rolls
 * back if the write fails, so a slow connection does not feel broken.
 */
export function BookmarkButton({
  noteId = null,
  pyqId = null,
  initial,
  variant = 'outline',
  showLabel = true,
  className,
}: {
  noteId?: string | null;
  pyqId?: string | null;
  initial: boolean;
  variant?: 'outline' | 'ghost';
  showLabel?: boolean;
  className?: string;
}) {
  const [bookmarked, setBookmarked] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const previous = bookmarked;
    setBookmarked(!previous);

    startTransition(async () => {
      const result = await toggleBookmark({ noteId, pyqId });
      if (!result.ok) {
        setBookmarked(previous);
        toast.error(result.message);
        return;
      }
      setBookmarked(result.bookmarked ?? !previous);
      toast.success(result.bookmarked ? 'Bookmarked' : 'Bookmark removed');
    });
  }

  const Icon = isPending ? Loader2 : bookmarked ? BookmarkCheck : Bookmark;

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={cn(bookmarked && 'text-brand-gold', className)}
    >
      <Icon className={cn(isPending && 'animate-spin')} />
      {showLabel ? (bookmarked ? 'Bookmarked' : 'Bookmark') : null}
    </Button>
  );
}
