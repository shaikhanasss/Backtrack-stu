import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen, FileText, Gamepad2, GraduationCap, Layers, ListOrdered, Users,
} from 'lucide-react';

import { getAdminStats } from '@/server/queries';
import { getRecentContent } from '@/server/admin-queries';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { StatusBadge } from '@/components/admin/status-controls';
import { EmptyState } from '@/components/brand/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin Overview' };

export default async function AdminOverviewPage() {
  const [stats, recent] = await Promise.all([getAdminStats(), getRecentContent(8)]);

  const contentCount = stats.notes + stats.pyqs + stats.quizzes;

  const primary = [
    {
      label: 'Students', value: stats.students, icon: Users,
      detail: `${stats.users} total users · ${stats.admins} admin(s)`, href: '/admin/users',
    },
    {
      label: 'Subjects', value: stats.subjects, icon: BookOpen,
      detail: `${stats.boards} board(s)`, href: '/admin/subjects',
    },
    {
      label: 'Chapters', value: stats.chapters, icon: ListOrdered,
      detail: 'Across all subjects', href: '/admin/chapters',
    },
    {
      label: 'Study Material', value: stats.notes, icon: BookOpen,
      detail: `${stats.publishedNotes} published · ${stats.notes - stats.publishedNotes} draft`,
      href: '/admin/notes',
    },
    {
      label: 'PYQs', value: stats.pyqs, icon: FileText,
      detail: 'Previous year papers', href: '/admin/pyqs',
    },
    {
      label: 'Quizzes', value: stats.quizzes, icon: Gamepad2,
      detail: `${stats.questions} questions · ${stats.attempts} attempts`, href: '/admin/quizzes',
    },
  ];

  const structure = [
    { label: 'Boards', value: stats.boards, icon: GraduationCap, href: '/admin/boards' },
    { label: 'Content items', value: contentCount, icon: Layers, href: '/admin/notes' },
  ];

  return (
    <AdminPageShell
      title="Overview"
      description="Live counts read directly from the database."
    >
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {primary.map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {structure.map((stat) => (
          <StatTile key={stat.label} {...stat} compact />
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recently added content</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="🗂️"
                title="No content yet"
                description="Create study material, a question paper or a quiz to see it here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {recent.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex flex-wrap items-center gap-3 px-6 py-4 transition-colors hover:bg-white/5"
                  >
                    <Badge variant="outline">{item.kind}</Badge>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-white">{item.title}</div>
                      <div className="truncate text-xs text-white/50">{item.context}</div>
                    </div>
                    <StatusBadge status={item.status} />
                    <span className="whitespace-nowrap text-xs text-white/50">
                      {formatDate(item.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

function StatTile({
  label, value, icon: Icon, detail, href, compact = false,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  detail?: string;
  href?: string;
  compact?: boolean;
}) {
  const body = (
    <div
      className={cn(
        'glass rounded-card p-6 transition-all duration-300',
        href && 'card-hover cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">{label}</p>
          <p className={cn('mt-1 font-bold text-white', compact ? 'text-2xl' : 'text-4xl')}>
            {value}
          </p>
        </div>
        <Icon size={compact ? 20 : 26} className="shrink-0 text-brand-gold" />
      </div>
      {detail ? <p className="mt-3 text-xs text-white/50">{detail}</p> : null}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
