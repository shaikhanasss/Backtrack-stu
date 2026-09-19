'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';

import type { ActionResult } from '@/server/actions/auth-actions';

/**
 * Shared submit handling for admin forms: runs the Server Action, maps any
 * server-side field errors back onto the form, shows a toast, refreshes the
 * list and closes the dialog. Every entity form uses this rather than
 * re-implementing the same eight lines.
 */
export function useEntitySubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  options: { successMessage: string; onDone?: () => void }
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        toast.error(result.message);
        Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as Path<T>, { message: messages[0] });
          }
        });
        return;
      }

      toast.success(options.successMessage);
      options.onDone?.();
      router.refresh();
    });
  }

  return { isPending, submit };
}
