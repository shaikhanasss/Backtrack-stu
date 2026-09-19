'use server';

import { prisma } from '@/lib/prisma';
import {
  boardSchema, classSchema, streamSchema, subjectSchema, chapterSchema,
} from '@/lib/validators/admin';
import { adminMutation, adminOperation, ADMIN_PATHS } from '@/server/actions/admin/shared';
import type { ActionResult } from '@/server/actions/auth-actions';

const HIERARCHY_PATHS = [
  ADMIN_PATHS.dashboard, ADMIN_PATHS.boards, ADMIN_PATHS.classes, ADMIN_PATHS.streams,
  ADMIN_PATHS.subjects, ADMIN_PATHS.chapters, '/dashboard/notes', '/',
];

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export async function createBoard(input: unknown): Promise<ActionResult> {
  return adminMutation(boardSchema, input, async (data) => {
    await prisma.board.create({ data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: { name: 'A board with that name already exists', slug: 'That slug is already used' },
  });
}

export async function updateBoard(id: string, input: unknown): Promise<ActionResult> {
  return adminMutation(boardSchema, input, async (data) => {
    await prisma.board.update({ where: { id }, data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: { name: 'A board with that name already exists', slug: 'That slug is already used' },
  });
}

export async function deleteBoard(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    // Cascades to classes -> subjects -> chapters -> notes/quizzes, which is
    // why the UI shows the affected counts before confirming.
    await prisma.board.delete({ where: { id } });
  }, { revalidate: HIERARCHY_PATHS });
}

export async function setBoardActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.board.update({ where: { id }, data: { isActive } });
  }, { revalidate: HIERARCHY_PATHS });
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export async function createClass(input: unknown): Promise<ActionResult> {
  return adminMutation(classSchema, input, async (data) => {
    await prisma.class.create({ data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: {
      level: 'That class level already exists for this board',
      slug: 'That slug is already used in this board',
    },
  });
}

export async function updateClass(id: string, input: unknown): Promise<ActionResult> {
  return adminMutation(classSchema, input, async (data) => {
    await prisma.class.update({ where: { id }, data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: {
      level: 'That class level already exists for this board',
      slug: 'That slug is already used in this board',
    },
  });
}

export async function deleteClass(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.class.delete({ where: { id } });
  }, { revalidate: HIERARCHY_PATHS });
}

export async function setClassActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.class.update({ where: { id }, data: { isActive } });
  }, { revalidate: HIERARCHY_PATHS });
}

// ---------------------------------------------------------------------------
// Stream
// ---------------------------------------------------------------------------

export async function createStream(input: unknown): Promise<ActionResult> {
  return adminMutation(streamSchema, input, async (data) => {
    await prisma.stream.create({ data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: { slug: 'That stream already exists for this board' },
  });
}

export async function updateStream(id: string, input: unknown): Promise<ActionResult> {
  return adminMutation(streamSchema, input, async (data) => {
    await prisma.stream.update({ where: { id }, data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: { slug: 'That stream already exists for this board' },
  });
}

export async function deleteStream(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    // Subjects reference streams with onDelete: SetNull, so deleting a stream
    // makes its subjects stream-less rather than destroying them.
    await prisma.stream.delete({ where: { id } });
  }, { revalidate: HIERARCHY_PATHS });
}

export async function setStreamActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.stream.update({ where: { id }, data: { isActive } });
  }, { revalidate: HIERARCHY_PATHS });
}

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------

/**
 * A subject's stream must belong to the same board as its class. Zod cannot
 * know that, so it is checked here against the database.
 */
async function assertStreamMatchesClass(classId: string, streamId: string | null) {
  if (!streamId) return null;

  const [klass, stream] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, select: { boardId: true } }),
    prisma.stream.findUnique({ where: { id: streamId }, select: { boardId: true } }),
  ]);

  if (!klass) return 'That class no longer exists.';
  if (!stream) return 'That stream no longer exists.';
  if (klass.boardId !== stream.boardId) {
    return 'That stream belongs to a different board than the selected class.';
  }
  return null;
}

export async function createSubject(input: unknown): Promise<ActionResult> {
  const schemaResult = subjectSchema.safeParse(input);
  if (schemaResult.success) {
    const problem = await assertStreamMatchesClass(
      schemaResult.data.classId,
      schemaResult.data.streamId
    );
    if (problem) {
      return { ok: false, message: problem, fieldErrors: { streamId: [problem] } };
    }
  }

  return adminMutation(subjectSchema, input, async (data) => {
    await prisma.subject.create({ data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: {
      slug: 'A subject with that slug already exists for this class and stream',
      code: 'That subject code is already in use',
    },
  });
}

export async function updateSubject(id: string, input: unknown): Promise<ActionResult> {
  const schemaResult = subjectSchema.safeParse(input);
  if (schemaResult.success) {
    const problem = await assertStreamMatchesClass(
      schemaResult.data.classId,
      schemaResult.data.streamId
    );
    if (problem) {
      return { ok: false, message: problem, fieldErrors: { streamId: [problem] } };
    }
  }

  return adminMutation(subjectSchema, input, async (data) => {
    await prisma.subject.update({ where: { id }, data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: {
      slug: 'A subject with that slug already exists for this class and stream',
      code: 'That subject code is already in use',
    },
  });
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.subject.delete({ where: { id } });
  }, { revalidate: HIERARCHY_PATHS });
}

export async function setSubjectActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.subject.update({ where: { id }, data: { isActive } });
  }, { revalidate: HIERARCHY_PATHS });
}

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

export async function createChapter(input: unknown): Promise<ActionResult> {
  return adminMutation(chapterSchema, input, async (data) => {
    await prisma.chapter.create({ data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: {
      number: 'That chapter number already exists in this subject',
      slug: 'That slug already exists in this subject',
    },
  });
}

export async function updateChapter(id: string, input: unknown): Promise<ActionResult> {
  return adminMutation(chapterSchema, input, async (data) => {
    await prisma.chapter.update({ where: { id }, data });
  }, {
    revalidate: HIERARCHY_PATHS,
    uniqueMessage: {
      number: 'That chapter number already exists in this subject',
      slug: 'That slug already exists in this subject',
    },
  });
}

export async function deleteChapter(id: string): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.chapter.delete({ where: { id } });
  }, { revalidate: HIERARCHY_PATHS });
}

export async function setChapterActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminOperation(async () => {
    await prisma.chapter.update({ where: { id }, data: { isActive } });
  }, { revalidate: HIERARCHY_PATHS });
}
