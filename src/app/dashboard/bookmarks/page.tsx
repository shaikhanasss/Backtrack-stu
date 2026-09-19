import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, FileText } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getBookmarks } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { BookmarkButton } from '@/components/student/bookmark-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Bookmarks' };

export default async function BookmarksPage() {
  const user = await requireUser('/dashboard/bookmarks');
  const bookmarks = await getBookmarks(user.id);

  const notes = bookmarks.filter((b) => b.note);
  const pyqs = bookmarks.filter((b) => b.pyq);

  return (
    <div className="space-y-8">
      <PageHeading
        title="🔖 Bookmarks"
        description={`${bookmarks.length} saved item${bookmarks.length === 1 ? '' : 's'}.`}
      />

      {bookmarks.length === 0 ? (
        <EmptyState
          icon="🔖"
          title="No bookmarks yet"
          description="Use the bookmark button on any study material or question paper to save it here for quick access."
        />
      ) : (
        <>
          {notes.length > 0 ? (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/55">
                <BookOpen size={14} /> Study material ({notes.length})
              </h2>
              <div className="space-y-3">
                {notes.map((bookmark) => (
                  <Card key={bookmark.id}>
                    <CardContent className="flex flex-wrap items-center gap-4 p-5">
                      <span className="text-2xl" aria-hidden="true">
                        {bookmark.note!.chapter.subject.icon ?? '📄'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/material/${bookmark.note!.id}`}
                          className="font-semibold text-white hover:text-brand-gold"
                        >
                          {bookmark.note!.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-white/50">
                          {bookmark.note!.chapter.subject.name} · Chapter{' '}
                          {bookmark.note!.chapter.number}: {bookmark.note!.chapter.title}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-white/40">
                        {formatDate(bookmark.createdAt)}
                      </span>
                      <div className="flex gap-2">
                        <BookmarkButton
                          noteId={bookmark.note!.id}
                          initial
                          showLabel={false}
                          variant="ghost"
                        />
                        <Button asChild size="sm">
                          <Link href={`/dashboard/material/${bookmark.note!.id}`}>Open</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {pyqs.length > 0 ? (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/55">
                <FileText size={14} /> Question papers ({pyqs.length})
              </h2>
              <div className="space-y-3">
                {pyqs.map((bookmark) => (
                  <Card key={bookmark.id}>
                    <CardContent className="flex flex-wrap items-center gap-4 p-5">
                      <FileText className="size-6 shrink-0 text-brand-gold" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{bookmark.pyq!.title}</p>
                        <p className="mt-0.5 truncate text-xs text-white/50">
                          {bookmark.pyq!.subject.name} · {bookmark.pyq!.subject.class.name}
                        </p>
                      </div>
                      <Badge variant="muted">{bookmark.pyq!.year}</Badge>
                      <div className="flex gap-2">
                        <BookmarkButton
                          pyqId={bookmark.pyq!.id}
                          initial
                          showLabel={false}
                          variant="ghost"
                        />
                        {bookmark.pyq!.questionFileId ? (
                          <Button asChild size="sm">
                            <a
                              href={`/api/files/${bookmark.pyq!.questionFileId}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open PDF
                            </a>
                          </Button>
                        ) : (
                          <Button asChild variant="outline" size="sm">
                            <Link href="/dashboard/pyqs">View</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
