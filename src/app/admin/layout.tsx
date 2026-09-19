import { requireAdmin } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

/**
 * Admin shell.
 *
 * `requireAdmin` is the real security boundary: it reads the role from the
 * database, so an admin demoted mid-session loses access on the next request
 * rather than when their token expires. Middleware only handles the redirect.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin('/admin');

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader user={user} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
