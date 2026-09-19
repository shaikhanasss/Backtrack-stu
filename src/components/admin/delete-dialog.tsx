'use client';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DeleteButton } from '@/components/admin/row-actions';
import { deleteEntity, type DeletableEntity } from '@/server/actions/admin/registry';

/**
 * Delete affordance plus its confirmation gate. Nothing is removed until the
 * admin confirms, and the description spells out what else goes with it.
 */
export function DeleteResourceDialog({
  entity, id, title, description, confirmLabel = 'Delete',
}: {
  entity: DeletableEntity;
  id: string;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
}) {
  return (
    <ConfirmDialog
      trigger={<DeleteButton />}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      action={() => deleteEntity(entity, id)}
    />
  );
}
