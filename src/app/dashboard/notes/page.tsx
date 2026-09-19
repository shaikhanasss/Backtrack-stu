import type { Metadata } from 'next';
import Link from 'next/link';

import { getBrowseBoards } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Notes' };

/** Level 1 of the academic tree. Everything here comes from the database. */
export default async function BrowseBoardsPage() {
  const boards = await getBrowseBoards();

  return (
    <div className="space-y-8">
      <PageHeading
        title="📚 Study Material"
        description="Pick your board to browse classes, subjects and chapters."
      />

      {boards.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No boards available yet"
          description="Boards are published from the admin panel. Once one is active it will appear here."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {boards.map((board) => (
            <Card key={board.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-4xl" aria-hidden="true">{board.icon ?? '🎓'}</div>
                  <Badge variant="muted">{board.classes.length} classes</Badge>
                </div>
                <CardTitle className="mt-3">
                  <Link href={`/dashboard/notes/${board.slug}`} className="hover:text-brand-gold">
                    {board.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {board.description ? (
                  <p className="text-sm text-white/65">{board.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {board.classes.map((klass) => (
                    <Link
                      key={klass.id}
                      href={`/dashboard/notes/${board.slug}/${klass.slug}`}
                      className="rounded-pill border border-white/20 px-4 py-1.5 text-sm text-white/80 transition-colors hover:border-brand-gold hover:text-brand-gold"
                    >
                      {klass.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
