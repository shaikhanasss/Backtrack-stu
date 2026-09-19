'use server';

import { prisma } from '@/lib/prisma';
import type { ContentStatus } from '@prisma/client';

import { noteSchema, pyqSchema } from '@/lib/validators/admin';
import { adminMutation, adminOperation, ADMIN_PATHS } from '@/server/actions/admin/shared';
import { getStorage } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth';
import type { ActionResult } from '@/server/actions/auth-actions';

const NOTE_PATHS = [ADMIN_PATHS.dashboard, ADMIN_PATHS.notes, '/dashboard/notes', '/dashboard', '/'];
const PYQ_PATHS = [ADMIN_PATHS.dashboard, ADMIN_PATHS.pyqs, '/dashboard/pyqs', '/'];

/** Publishing stamps publishedAt the first time only. */
function publishFields(status: ContentStatus, existingPublishedAt: Date | null) {
  return {
    status,
    publishedAt: status === 'PUBLISHED' ? (existingPublishedAt ?? new Date()) : existingPublishedAt,
  };
}

// ---------------------------------------------------------------------------
// Study material (Note)
// ---------------------------------------------------------------------------

export async function createNote(input: unknown): Promise<ActionResult> {
  return adminMutation(noteSchema, input, async (data) => {
    const { imageFileIds, status, ...rest } = data;

    await prisma.note.create({
      data: {
        ...rest,
        ...publishFields(status, null),
        images: {
          create: imageFileIds.map((fileId, index) => ({ fileId, displayOrder: index })),
        },
      },
    });
  }, {
    revalidate: NOTE_PATHS,
    uniqueMessage: { slug: 'A note with that slug already exists in this chapter' },
  });
}

export async function updateNote(id: string, input: unknown): Promise<ActionResult> {
  return adminMutation(noteSchema, input, async (data) => {
    const { imageFileIds, status, ...rest } = data;

    const existing = await prisma.note.findUnique({
      where: { id },
      select: { publishedAt: true },
    });

    await prisma.$transaction([
      // Replace the image set wholesale — simpler and safer than diffing, and
      // the join rows carry no data worth preserving beyond order.
      prisma.noteImage.deleteMany({ where: { noteId: id } }),
      prisma.note.update({
        where: { id },
        data: {
          ...rest,
          ...publishFields(status, existing?.publishedAt ?? null),
          images: {
            create: imageFileIds.map((fileId, index) => ({ fileId, displayOrder: index })),
          },
        },
      }),
    ]);
  }, {
    revalidate: NOTE_PATHS,
    uniqueMessage: { slug: 'A note with that slug already exists in this chapter' },
  });
}

export async function deleteNote(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.note.delete({ where: { id } });
  }, { revalidate: NOTE_PATHS });
}

export async function setNoteStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  return adminOperation(async () => {
    const existing = await prisma.note.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    await prisma.note.update({
      where: { id },
      data: publishFields(status, existing?.publishedAt ?? null),
    });
  }, { revalidate: NOTE_PATHS });
}

// ---------------------------------------------------------------------------
// PYQ
// ---------------------------------------------------------------------------

/** A PYQ's chapter, when set, must belong to its subject. */
async function assertChapterInSubject(subjectId: string, chapterId: string | null) {
  if (!chapterId) return null;
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { subjectId: true },
  });
  if (!chapter) return 'That chapter no longer exists.';
  if (chapter.subjectId !== subjectId) {
    return 'That chapter belongs to a different subject.';
  }
  return null;
}

export async function createPyq(input: unknown): Promise<ActionResult> {
  const parsed = pyqSchema.safeParse(input);
  if (parsed.success) {
    const problem = await assertChapterInSubject(parsed.data.subjectId, parsed.data.chapterId);
    if (problem) return { ok: false, message: problem, fieldErrors: { chapterId: [problem] } };
  }

  return adminMutation(pyqSchema, input, async (data) => {
    const { status, ...rest } = data;
    await prisma.pyq.create({ data: { ...rest, ...publishFields(status, null) } });
  }, { revalidate: PYQ_PATHS });
}

export async function updatePyq(id: string, input: unknown): Promise<ActionResult> {
  const parsed = pyqSchema.safeParse(input);
  if (parsed.success) {
    const problem = await assertChapterInSubject(parsed.data.subjectId, parsed.data.chapterId);
    if (problem) return { ok: false, message: problem, fieldErrors: { chapterId: [problem] } };
  }

  return adminMutation(pyqSchema, input, async (data) => {
    const { status, ...rest } = data;
    const existing = await prisma.pyq.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    await prisma.pyq.update({
      where: { id },
      data: { ...rest, ...publishFields(status, existing?.publishedAt ?? null) },
    });
  }, { revalidate: PYQ_PATHS });
}

export async function deletePyq(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.pyq.delete({ where: { id } });
  }, { revalidate: PYQ_PATHS });
}

export async function setPyqStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  return adminOperation(async () => {
    const existing = await prisma.pyq.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    await prisma.pyq.update({
      where: { id },
      data: publishFields(status, existing?.publishedAt ?? null),
    });
  }, { revalidate: PYQ_PATHS });
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

/**
 * Deletes an uploaded file from both the database and the storage provider.
 * The row goes first: if the provider call fails afterwards the app is still
 * consistent, and the leftover bytes can be swept later. The reverse order
 * would leave a row pointing at nothing.
 */
export async function deleteFileAsset(id: string): Promise<ActionResult> {
  await requireAdmin();

  // This lookup runs before adminOperation's error handling, so a non-string id
  // would throw out of the action instead of returning a result. Every export
  // of a 'use server' module is a public endpoint, so guard the input here.
  if (typeof id !== 'string' || id.length === 0) {
    return { ok: false, message: 'Missing file id.' };
  }

  const asset = await prisma.fileAsset.findUnique({
    where: { id },
    select: { storageKey: true },
  });
  if (!asset) return { ok: false, message: 'That file no longer exists.' };

  return adminOperation(async () => {
    await prisma.fileAsset.delete({ where: { id } });
    await getStorage().delete(asset.storageKey);
  }, { revalidate: [...NOTE_PATHS, ...PYQ_PATHS] });
}
