import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getBoardBySlug } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { Breadcrumbs } from '@/components/student/breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ board: string }>;
}): Promise<Metadata> {
  const { board } = await params;
  const record = await getBoardBySlug(board);
  return { title: record ? `${record.name} Notes` : 'Notes' };
}

/** Level 2: classes within a board. */
export default async function BoardPage({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const { board: boardSlug } = await params;
  const board = await getBoardBySlug(boardSlug);

  if (!board) notFound();

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Study Material', href: '/dashboard/notes' },
          { label: board.name },
        ]}
      />

      <PageHeading
        title={`${board.icon ?? '🎓'} ${board.name}`}
        description={board.description ?? 'Choose a class to see its subjects.'}
      />

      {board.classes.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No classes yet"
          description="This board has no active classes. An admin can add them from the admin panel."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {board.classes.map((klass) => (
            <Link key={klass.id} href={`/dashboard/notes/${board.slug}/${klass.slug}`}>
              <Card className="card-hover h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{klass.name}</CardTitle>
                    <Badge variant="muted">{klass._count.subjects} subjects</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-white/60">
                  Level {klass.level}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {board.streams.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">
            Streams in {board.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {board.streams.map((stream) => (
              <Badge key={stream.id} variant="outline">
                {stream.icon ? `${stream.icon} ` : ''}{stream.name}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
