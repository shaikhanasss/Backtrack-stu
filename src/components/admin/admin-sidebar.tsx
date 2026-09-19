'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BookOpen, FileText, Gamepad2, GraduationCap, Layers, LayoutDashboard, ListOrdered,
  Menu, Users, Waypoints, X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  /** Only the overview matches exactly; the rest match by prefix. */
  exact?: boolean;
}

/** Grouped so the academic hierarchy reads top-down in the order it nests. */
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    label: 'Hierarchy',
    items: [
      { href: '/admin/boards', label: 'Boards', icon: GraduationCap },
      { href: '/admin/classes', label: 'Classes', icon: Layers },
      { href: '/admin/streams', label: 'Streams', icon: Waypoints },
      { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
      { href: '/admin/chapters', label: 'Chapters', icon: ListOrdered },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/notes', label: 'Study Material', icon: BookOpen },
      { href: '/admin/pyqs', label: 'PYQs', icon: FileText },
      { href: '/admin/quizzes', label: 'Quizzes', icon: Gamepad2 },
    ],
  },
];

/**
 * Admin sidebar. Fixed on large screens, collapsible behind a menu button on
 * small ones so the panel stays usable on a phone.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex} className="flex flex-col gap-1">
          {group.label ? (
            <p className="px-4 pb-1 text-[11px] uppercase tracking-wide text-white/40">
              {group.label}
            </p>
          ) : null}
          {group.items.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-brand-gold font-semibold text-brand-navy'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-brand-gold p-4 text-brand-navy shadow-lg lg:hidden"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile drawer */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-brand-navy/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="glass h-full w-72 max-w-[80%] overflow-y-auto p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <Logo href="/admin" className="text-2xl" />
            <p className="mb-6 mt-1 text-xs uppercase tracking-wide text-white/50">
              Admin Panel
            </p>
            {nav}
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-white/5 p-6 lg:block">
        <div className="sticky top-24">
          <p className="mb-6 text-xs uppercase tracking-wide text-white/50">
            Admin Panel
          </p>
          {nav}
        </div>
      </aside>
    </>
  );
}
