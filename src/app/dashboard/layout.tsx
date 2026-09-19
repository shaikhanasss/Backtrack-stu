import { requireUser } from '@/lib/auth';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { DashboardNav } from '@/components/layout/dashboard-nav';

/**
 * Server-side guard for the whole student area.
 *
 * Middleware already redirects unauthenticated visitors, but this check is the
 * one that actually matters — middleware is a UX convenience and can be
 * bypassed by calling a Server Action directly.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser('/dashboard');

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <DashboardNav isAdmin={user.role === 'ADMIN'} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
