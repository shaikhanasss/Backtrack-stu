'use client';

import { useState } from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/storage/types';

/**
 * PDF viewer.
 *
 * Uses the browser's built-in PDF renderer through an <iframe> rather than
 * shipping a JavaScript PDF engine: it is a fraction of the bundle, handles
 * paging, zoom and text selection natively, and degrades to a download link
 * where inline PDF viewing is unavailable (notably iOS Safari).
 *
 * The src points at /api/files/[id], so the session check still applies.
 */
export function PdfViewer({
  fileId,
  fileName,
  sizeBytes,
}: {
  fileId: string;
  fileName: string;
  sizeBytes?: number;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-white/70">
          <FileText size={16} className="shrink-0 text-brand-gold" />
          <span className="truncate">{fileName}</span>
          {sizeBytes ? (
            <span className="shrink-0 text-white/45">{formatBytes(sizeBytes)}</span>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/files/${fileId}`} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Open
            </a>
          </Button>
          <Button asChild size="sm">
            <a href={`/api/files/${fileId}?download=1`}>
              <Download size={14} /> Download
            </a>
          </Button>
        </div>
      </div>

      {failed ? (
        <div className="glass rounded-card p-8 text-center text-sm text-white/65">
          Your browser could not display this PDF inline. Use Open or Download
          above to read it.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-white/10 bg-white/5">
          <iframe
            src={`/api/files/${fileId}`}
            title={fileName}
            className="h-[70vh] max-h-[900px] w-full"
            onError={() => setFailed(true)}
          />
        </div>
      )}
    </div>
  );
}

/** Image material, shown full-width with an optional caption. */
export function ImageViewer({
  images,
}: {
  images: { id: string; caption: string | null; file: { id: string; originalName: string } }[];
}) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-6">
      {images.map((image, index) => (
        <figure key={image.id} className="space-y-2">
          {/* Served through the authorised file route, not a public directory. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${image.file.id}`}
            alt={image.caption ?? `Figure ${index + 1} for this material`}
            className="w-full rounded-card border border-white/10 bg-white/5"
            loading="lazy"
          />
          <figcaption className="text-center text-xs text-white/55">
            {image.caption ?? `Figure ${index + 1}`}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
