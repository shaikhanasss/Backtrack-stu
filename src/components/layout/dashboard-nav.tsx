'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen, Bookmark, FileText, Gamepad2, LayoutDashboard, Search,
  Shield, TrendingUp, User,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/notes', label: 'Notes', icon: BookOpen },
  { href: '/dashboard/pyqs', label: 'PYQs', icon: FileText },
  { href: '/dashboard/quiz', label: 'Quiz', icon: Gamepad2 },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
  { href: '/dashboard/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const links = isAdmin
    ? [...LINKS, { href: '/admin', label: 'Admin', icon: Shield }]
    : LINKS;

  return (
    <nav className="border-b border-white/10 bg-white/5">
      <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-5 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          // `/dashboard` should not stay highlighted on every child route.
          const isActive =
            href === '/dashboard' ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-pill px-4 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-brand-gold font-semibold text-brand-navy'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
