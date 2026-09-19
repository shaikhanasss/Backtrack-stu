import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** Consistent edit/delete affordances for every admin table row. */
export function EditButton({ label = 'Edit' }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" aria-label={label}>
      <Pencil size={14} />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </Button>
  );
}

export function DeleteButton({ label = 'Delete' }: { label?: string }) {
  return (
    <Button variant="ghost" size="sm" className="text-destructive" aria-label={label}>
      <Trash2 size={14} />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </Button>
  );
}
