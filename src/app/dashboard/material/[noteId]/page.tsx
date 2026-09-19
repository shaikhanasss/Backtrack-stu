import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getNoteForStudent, getChapterSiblings } from '@/server/student-queries';
import { Breadcrumbs } from '@/components/student/breadcrumbs';
import { BookmarkButton } from '@/components/student/bookmark-button';
import { NoteActions } from '@/components/student/note-actions';
import { PdfViewer, ImageViewer } from '@/components/student/file-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/brand/empty-state';
import { formatDate } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ noteId: string }>;
}): Promise<Metadata> {
  const user = await requireUser();
  const { noteId } = await params;
  const note = await getNoteForStudent(noteId, user.id);
  return { title: note?.title ?? 'Study Material' };
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const user = await requireUser();
  const { noteId } = await params;

  const note = await getNoteForStudent(noteId, user.id);
  if (!note) notFound();

  const siblings = await getChapterSiblings(note.chapter.id, note.id);
  const progress = note.progress[0];
  const { subject } = note.chapter;
  const hasBody = Boolean(note.content || note.pdfFile || note.images.length > 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Study Material', href: '/dashboard/notes' },
          { label: subject.class.board.name, href: `/dashboard/notes/${subject.class.board.slug}` },
          {
            label: subject.class.name,
            href: `/dashboard/notes/${subject.class.board.slug}/${subject.class.slug}`,
          },
          { label: subject.name, href: `/dashboard/subjects/${subject.id}` },
          { label: `Chapter ${note.chapter.number}`, href: `/dashboard/chapters/${note.chapter.id}` },
          { label: note.title },
        ]}
      />

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{note.title}</h1>
            <p className="mt-1 text-sm text-white/60">
              {subject.icon} {subject.name} · Chapter {note.chapter.number}: {note.chapter.title}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BookmarkButton noteId={note.id} initial={note.bookmarks.length > 0} />
            <NoteActions noteId={note.id} initialCompleted={progress?.status === 'COMPLETED'} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
          {progress?.status === 'COMPLETED' ? <Badge>Completed</Badge> : null}
          {progress?.lastReadAt ? (
            <span className="flex items-center gap-1">
              <Clock size={12} /> Last opened {formatDate(progress.lastReadAt)}
            </span>
          ) : null}
          <span>{note.viewCount} views</span>
          {siblings.total > 1 ? (
            <span>
              {siblings.position} of {siblings.total} in this chapter
            </span>
          ) : null}
        </div>

        {note.summary ? (
          <p className="rounded-card bg-white/5 p-4 text-white/75">{note.summary}</p>
        ) : null}
      </header>

      <Separator />

      {!hasBody ? (
        <EmptyState
          icon="📄"
          title="No content attached yet"
          description="This material has been published but has no text, PDF or images attached."
        />
      ) : null}

      {note.content ? (
        <Card>
          <CardContent className="p-6">
            {/* Stored as plain text/markdown; rendered with whitespace preserved
                rather than as HTML, so note content can never inject markup. */}
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">
              {note.content}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {note.pdfFile ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">PDF</h2>
          <PdfViewer
            fileId={note.pdfFile.id}
            fileName={note.pdfFile.originalName}
            sizeBytes={note.pdfFile.sizeBytes}
          />
        </section>
      ) : null}

      {note.images.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">Images</h2>
          <ImageViewer images={note.images} />
        </section>
      ) : null}

      <Separator />

      <nav className="flex flex-wrap items-center justify-between gap-3">
        {siblings.previous ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/material/${siblings.previous.id}`}>
              <ArrowLeft size={14} /> {siblings.previous.title}
            </Link>
          </Button>
        ) : (
          <span />
        )}

        {siblings.next ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/material/${siblings.next.id}`}>
              {siblings.next.title} <ArrowRight size={14} />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/chapters/${note.chapter.id}`}>Back to chapter</Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
