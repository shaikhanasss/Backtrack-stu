import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/layout/user-menu';
import type { CurrentUser } from '@/lib/auth';

/** Admin header: wordmark, role badge, link back to the student app, user menu. */
export function AdminHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="glass sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-3">
        <Logo href="/admin" />
        <Badge>ADMIN</Badge>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            Student view <ExternalLink size={14} />
          </Link>
        </Button>
        <UserMenu name={user.name} email={user.email} role={user.role} />
      </div>
    </header>
  );
}
