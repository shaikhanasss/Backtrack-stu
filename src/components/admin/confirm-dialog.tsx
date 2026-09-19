'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ActionResult } from '@/server/actions/auth-actions';

/**
 * Confirmation gate for destructive operations.
 *
 * Nothing in the admin panel deletes without passing through this: the trigger
 * opens the dialog, and only the explicit confirm button runs the action.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Delete',
  action,
  onDone,
}: {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  action: () => Promise<ActionResult>;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirm(event: React.MouseEvent) {
    // Keep the dialog open while the action runs so the spinner is visible.
    event.preventDefault();
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(`${confirmLabel} successful`);
        setOpen(false);
        onDone?.();
      } else {
        toast.error(result.message);
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            {isPending ? 'Working...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
