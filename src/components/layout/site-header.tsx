import Link from 'next/link';

import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from '@/components/layout/user-menu';

const PUBLIC_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Notes', href: '/dashboard/notes' },
  { label: 'PYQs', href: '/dashboard/pyqs' },
  { label: 'Quiz', href: '/dashboard/quiz' },
];

/**
 * Port of `Header.jsx`. The prototype took a `links` array as a prop and every
 * public link pointed at /login. Here the header reads the real user row, so a
 * renamed profile or a changed avatar shows up immediately.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="glass sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-12">
      <Logo />

      <nav className="flex flex-wrap items-center gap-6">
        {PUBLIC_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-white/90 transition-colors hover:text-brand-gold"
          >
            {link.label}
          </Link>
        ))}

        {user ? (
          <UserMenu
            name={user.name}
            email={user.email}
            role={user.role}
            image={user.image}
          />
        ) : (
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
