import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getClassWithSubjects } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { Breadcrumbs } from '@/components/student/breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Subjects' };

/**
 * Level 3: subjects for a class.
 *
 * Streams appear as filter chips rather than a URL segment of their own,
 * because they are optional — SSC has none, and some HSC subjects belong to no
 * stream at all. "Common" selects exactly those stream-less subjects.
 */
export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ board: string; class: string }>;
  searchParams: Promise<{ stream?: string }>;
}) {
  const { board: boardSlug, class: classSlug } = await params;
  const { stream } = await searchParams;

  const data = await getClassWithSubjects(boardSlug, classSlug, stream);
  if (!data) notFound();

  const { klass, streams, hasGeneral, activeStream, subjects } = data;
  const base = `/dashboard/notes/${boardSlug}/${classSlug}`;

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Study Material', href: '/dashboard/notes' },
          { label: klass.board.name, href: `/dashboard/notes/${boardSlug}` },
          { label: klass.name },
          ...(activeStream ? [{ label: activeStream.name }] : []),
        ]}
      />

      <PageHeading
        title={`${klass.board.name} · ${klass.name}`}
        description="Choose a subject to see its chapters."
      />

      {/* Stream chips render only when this class actually has streams. */}
      {streams.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <StreamChip href={base} label="All subjects" active={!stream} />
          {hasGeneral ? (
            <StreamChip href={`${base}?stream=general`} label="Common" active={stream === 'general'} />
          ) : null}
          {streams.map((s) => (
            <StreamChip
              key={s.id}
              href={`${base}?stream=${s.slug}`}
              label={`${s.icon ? `${s.icon} ` : ''}${s.name}`}
              active={stream === s.slug}
            />
          ))}
        </div>
      ) : null}

      {subjects.length === 0 ? (
        <EmptyState
          icon="📖"
          title={activeStream ? `No subjects in ${activeStream.name}` : 'No subjects yet'}
          description={
            activeStream
              ? 'Try another stream, or view all subjects for this class.'
              : 'Subjects are added from the admin panel.'
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`}>
              <Card className="card-hover h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl" aria-hidden="true">{subject.icon ?? '📖'}</span>
                    {subject.stream ? (
                      <Badge variant="secondary">{subject.stream.name}</Badge>
                    ) : streams.length > 0 ? (
                      <Badge variant="muted">Common</Badge>
                    ) : null}
                  </div>
                  <CardTitle className="mt-3">{subject.name}</CardTitle>
                  {subject.code ? (
                    <p className="font-mono text-xs text-white/45">{subject.code}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="text-sm text-white/60">
                  {subject._count.chapters} chapters · {subject._count.pyqs} PYQs ·{' '}
                  {subject._count.quizzes} quizzes
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StreamChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-pill border px-4 py-1.5 text-sm transition-colors',
        active
          ? 'border-brand-gold bg-brand-gold font-semibold text-brand-navy'
          : 'border-white/20 text-white/75 hover:border-brand-gold hover:text-brand-gold'
      )}
    >
      {label}
    </Link>
  );
}
