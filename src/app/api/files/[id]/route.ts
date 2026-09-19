import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage';

/**
 * Serves an uploaded file.
 *
 * Files live outside `public/`, so this route is the only way to read them.
 * That keeps access under application control: draft content is restricted to
 * admins, and published content requires a signed-in user.
 *
 * `?download=1` forces a save dialog instead of inline display.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = await prisma.fileAsset.findUnique({
    where: { id },
    select: {
      storageKey: true,
      mimeType: true,
      originalName: true,
      sizeBytes: true,
      uploadedById: true,
      noteAsPdf: { select: { status: true } },
      noteAsThumbnail: { select: { status: true } },
      noteImages: { select: { note: { select: { status: true } } } },
      pyqAsQuestion: { select: { status: true } },
      pyqAsSolution: { select: { status: true } },
    },
  });

  if (!asset) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  // Every content item this file is attached to. An unattached file (just
  // uploaded, not yet saved to a note) has none.
  const owners = [
    ...asset.noteAsPdf.map((n) => n.status),
    ...asset.noteAsThumbnail.map((n) => n.status),
    ...asset.noteImages.map((i) => i.note.status),
    ...asset.pyqAsQuestion.map((p) => p.status),
    ...asset.pyqAsSolution.map((p) => p.status),
  ];

  const isPublished = owners.some((status) => status === 'PUBLISHED');

  // A file with no owning content is an avatar (or a fresh upload not yet
  // attached); its uploader may always read it.
  const isOwnUpload = asset.uploadedById === user.id;

  // Students may only read files belonging to published content.
  if (user.role !== 'ADMIN' && !isPublished && !isOwnUpload) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const storage = getStorage();

  let data: Buffer;
  try {
    data = await storage.read(asset.storageKey);
  } catch {
    // Row exists but the bytes are gone — report it honestly rather than 500.
    return NextResponse.json(
      { error: 'File is missing from storage' },
      { status: 410 }
    );
  }

  const url = new URL(request.url);
  const disposition = url.searchParams.get('download') === '1' ? 'attachment' : 'inline';

  // Quote and strip the filename: it is user-supplied and must not be able to
  // inject extra header directives.
  const safeName = asset.originalName.replace(/["\r\n]/g, '');

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType,
      'Content-Length': String(data.byteLength),
      'Content-Disposition': `${disposition}; filename="${safeName}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
