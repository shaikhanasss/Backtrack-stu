'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import type { ContentStatus } from '@prisma/client';

import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { setEntityActive, setEntityStatus } from '@/server/actions/admin/registry';
import type { ActivatableEntity, PublishableEntity } from '@/server/actions/admin/registry';

/** Active/inactive toggle for hierarchy rows. Writes immediately. */
export function ActiveToggle({
  entity, id, isActive, label,
}: {
  entity: ActivatableEntity;
  id: string;
  isActive: boolean;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${label}`}
      onCheckedChange={(next) =>
        startTransition(async () => {
          const result = await setEntityActive(entity, id, next);
          if (result.ok) toast.success(next ? `${label} activated` : `${label} deactivated`);
          else toast.error(result.message);
        })
      }
    />
  );
}

/** Draft ⇄ Published toggle for content rows. */
export function PublishToggle({
  entity, id, status, label,
}: {
  entity: PublishableEntity;
  id: string;
  status: ContentStatus;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();
  const published = status === 'PUBLISHED';

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={published}
        disabled={isPending || status === 'ARCHIVED'}
        aria-label={`${published ? 'Unpublish' : 'Publish'} ${label}`}
        onCheckedChange={(next) =>
          startTransition(async () => {
            const result = await setEntityStatus(entity, id, next ? 'PUBLISHED' : 'DRAFT');
            if (result.ok) toast.success(next ? `${label} published` : `${label} unpublished`);
            else toast.error(result.message);
          })
        }
      />
      <StatusBadge status={status} />
    </div>
  );
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  const variant =
    status === 'PUBLISHED' ? 'default' : status === 'DRAFT' ? 'muted' : 'outline';
  return <Badge variant={variant}>{status}</Badge>;
}
