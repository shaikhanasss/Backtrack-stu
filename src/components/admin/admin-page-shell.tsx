import { PageHeading } from '@/components/brand/page-heading';

/** Standard admin page frame: heading, primary action, toolbar slot, body. */
export function AdminPageShell({
  title,
  description,
  action,
  toolbar,
  children,
  footer,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title={title} description={description} />
        {action}
      </div>

      {toolbar}

      {children}

      {footer}
    </div>
  );
}
