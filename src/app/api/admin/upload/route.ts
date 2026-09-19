import { NextResponse } from 'next/server';
import type { FileKind } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStorage, UPLOAD_RULES, formatBytes } from '@/lib/storage';

/**
 * Admin file upload.
 *
 * Validates size, MIME type and extension BEFORE writing anything to disk, and
 * records metadata in Postgres. Returns the FileAsset so the calling form can
 * attach it to a note or PYQ.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const kindRaw = String(formData.get('kind') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (kindRaw !== 'PDF' && kindRaw !== 'IMAGE') {
    return NextResponse.json({ error: 'kind must be PDF or IMAGE' }, { status: 400 });
  }

  const kind = kindRaw as FileKind;
  const rules = UPLOAD_RULES[kind];

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (file.size > rules.maxBytes) {
    return NextResponse.json(
      { error: `File is too large. Maximum for ${kind} is ${formatBytes(rules.maxBytes)}.` },
      { status: 413 }
    );
  }
  if (!(rules.mimeTypes as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type "${file.type || 'unknown'}". Allowed: ${rules.mimeTypes.join(', ')}` },
      { status: 415 }
    );
  }

  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!(rules.extensions as readonly string[]).includes(extension)) {
    return NextResponse.json(
      { error: `Unsupported extension "${extension}". Allowed: ${rules.extensions.join(', ')}` },
      { status: 415 }
    );
  }

  const data = Buffer.from(await file.arrayBuffer());

  // Check the magic bytes, not just the declared type: a browser will happily
  // report application/pdf for a renamed executable.
  if (kind === 'PDF' && data.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return NextResponse.json(
      { error: 'That file is not a valid PDF.' },
      { status: 415 }
    );
  }

  const storage = getStorage();
  const saved = await storage.save({
    kind,
    originalName: file.name,
    mimeType: file.type,
    data,
  });

  try {
    const asset = await prisma.fileAsset.create({
      data: {
        kind,
        storageKey: saved.storageKey,
        originalName: file.name.slice(0, 255),
        mimeType: file.type,
        sizeBytes: saved.sizeBytes,
        uploadedById: user.id,
      },
      select: {
        id: true,
        kind: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
      },
    });

    return NextResponse.json({ file: asset }, { status: 201 });
  } catch (error) {
    // Do not leave an orphaned file on disk if the row could not be written.
    await storage.delete(saved.storageKey);
    throw error;
  }
}
