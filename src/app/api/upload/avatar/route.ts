import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStorage, UPLOAD_RULES, formatBytes } from '@/lib/storage';

/**
 * Avatar upload for any signed-in user.
 *
 * Separate from /api/admin/upload on purpose: that route is for course content
 * and is admin-only. This one accepts images only, applies a tighter size cap,
 * and records the uploader so `setProfileImage` can verify the file belongs to
 * the person attaching it.
 */
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const rules = UPLOAD_RULES.IMAGE;

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json(
      { error: `Image is too large. Maximum is ${formatBytes(AVATAR_MAX_BYTES)}.` },
      { status: 413 }
    );
  }
  if (!(rules.mimeTypes as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type "${file.type || 'unknown'}". Use PNG, JPEG, WebP or GIF.` },
      { status: 415 }
    );
  }

  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!(rules.extensions as readonly string[]).includes(extension)) {
    return NextResponse.json({ error: `Unsupported extension "${extension}".` }, { status: 415 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  const saved = await storage.save({
    kind: 'IMAGE',
    originalName: file.name,
    mimeType: file.type,
    data,
  });

  try {
    const asset = await prisma.fileAsset.create({
      data: {
        kind: 'IMAGE',
        storageKey: saved.storageKey,
        originalName: file.name.slice(0, 255),
        mimeType: file.type,
        sizeBytes: saved.sizeBytes,
        uploadedById: user.id,
      },
      select: { id: true, originalName: true, sizeBytes: true, mimeType: true, kind: true },
    });

    return NextResponse.json({ file: asset }, { status: 201 });
  } catch (error) {
    await storage.delete(saved.storageKey);
    throw error;
  }
}
