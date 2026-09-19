'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** Consistent footer for every admin form dialog. */
export function FormActions({
  isPending,
  onCancel,
  submitLabel = 'Save',
}: {
  isPending: boolean;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : null}
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );
}
