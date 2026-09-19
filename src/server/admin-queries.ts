import 'server-only';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { buildOrderBy, paginate, type ListParams } from '@/lib/admin/query-params';

/**
 * Read side for the admin list screens.
 *
 * Every function takes the parsed URL params and returns a page of rows plus
 * the total, so search, filtering, sorting and pagination all happen in
 * Postgres rather than by loading the table and slicing it in JavaScript.
 */

const insensitive = (q: string): Prisma.StringFilter => ({ contains: q, mode: 'insensitive' });

// --- Boards ----------------------------------------------------------------

export async function listBoards(params: ListParams) {
  const where: Prisma.BoardWhereInput = {
    ...(params.q
      ? { OR: [{ name: insensitive(params.q) }, { slug: insensitive(params.q) }] }
      : {}),
    ...(params.filters.status ? { isActive: params.filters.status === 'active' } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.board.findMany({
      where,
      orderBy: buildOrderBy(params.sort, params.dir) as Prisma.BoardOrderByWithRelationInput,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { _count: { select: { classes: true, streams: true } } },
    }),
    prisma.board.count({ where }),
  ]);

  return paginate(rows, total, params);
}

// --- Classes ---------------------------------------------------------------

export async function listClasses(params: ListParams) {
  const where: Prisma.ClassWhereInput = {
    ...(params.q
      ? { OR: [{ name: insensitive(params.q) }, { slug: insensitive(params.q) }] }
      : {}),
    ...(params.filters.boardId ? { boardId: params.filters.boardId } : {}),
    ...(params.filters.status ? { isActive: params.filters.status === 'active' } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.class.findMany({
      where,
      orderBy: buildOrderBy(params.sort, params.dir) as Prisma.ClassOrderByWithRelationInput,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { board: true, _count: { select: { subjects: true } } },
    }),
    prisma.class.count({ where }),
  ]);

  return paginate(rows, total, params);
}

// --- Streams ---------------------------------------------------------------

export async function listStreams(params: ListParams) {
  const where: Prisma.StreamWhereInput = {
    ...(params.q
      ? { OR: [{ name: insensitive(params.q) }, { slug: insensitive(params.q) }] }
      : {}),
    ...(params.filters.boardId ? { boardId: params.filters.boardId } : {}),
    ...(params.filters.status ? { isActive: params.filters.status === 'active' } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.stream.findMany({
      where,
      orderBy: buildOrderBy(params.sort, params.dir) as Prisma.StreamOrderByWithRelationInput,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { board: true, _count: { select: { subjects: true } } },
    }),
    prisma.stream.count({ where }),
  ]);

  return paginate(rows, total, params);
}

// --- Subjects --------------------------------------------------------------

export async function listSubjects(params: ListParams) {
  const where: Prisma.SubjectWhereInput = {
    ...(params.q
      ? {
          OR: [
            { name: insensitive(params.q) },
            { slug: insensitive(params.q) },
            { code: insensitive(params.q) },
          ],
        }
      : {}),
    ...(params.filters.classId ? { classId: params.filters.classId } : {}),
    ...(params.filters.boardId ? { class: { boardId: params.filters.boardId } } : {}),
    ...(params.filters.streamId
      ? params.filters.streamId === 'none'
        ? { streamId: null }
        : { streamId: params.filters.streamId }
      : {}),
    ...(params.filters.status ? { isActive: params.filters.status === 'active' } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      orderBy: buildOrderBy(params.sort, params.dir) as Prisma.SubjectOrderByWithRelationInput,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        class: { include: { board: true } },
        stream: true,
        _count: { select: { chapters: true, pyqs: true, quizzes: true } },
      },
    }),
    prisma.subject.count({ where }),
  ]);

  return paginate(rows, total, params);
}

// --- Chapters --------------------------------------------------------------

export async function listChapters(params: ListParams) {
  const where: Prisma.ChapterWhereInput = {
    ...(params.q
      ? { OR: [{ title: insensitive(params.q) }, { slug: insensitive(params.q) }] }
      : {}),
    ...(params.filters.subjectId ? { subjectId: params.filters.subjectId } : {}),
    ...(params.filters.classId ? { subject: { classId: params.filters.classId } } : {}),
    ...(params.filters.status ? { isActive: params.filters.status === 'active' } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.chapter.findMany({
      where,
      orderBy: buildOrderBy(params.sort, params.dir) as Prisma.ChapterOrderByWithRelationInput,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        subject: { include: { class: { include: { board: true } } } },
        _count: { select: { notes: true, quizzes: true, pyqs: true } },
      },
    }),
    prisma.chapter.count({ where }),
  ]);

  return paginate(rows, total, params);
}

// --- Notes -----------------------------------------------------------------

export async function listNotes(params: ListParams) {
  const where: Prisma.NoteWhereInput = {
    ...(params.q
      ? { OR: [{ title: insensitive(params.q) }, { summary: insensitive(params.q) }] }
      : {}),
    ...(params.filters.chapterId ? { chapterId: params.filters.chapterId } : {}),
    ...(params.filters.subjectId ? { chapter: { subjectId: params.filters.subjectId } } : {}),
    ...(params.filters.status
      ? { status: params.filters.status as Prisma.EnumContentStatusFilter['equals'] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: buildOrderBy(params.sort, params.dir) as Prisma.NoteOrderByWithRelationInput,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        chapter: { include: { subject: { include: { class: { include: { board: true } } } } } },
        pdfFile: true,
        thumbnailFile: true,
        // Included in full so the edit dialog can round-trip the image set
        // instead of silently clearing it on save.
        images: { orderBy: { displayOrder: 'asc' }, include: { file: true } },
        _count: { select: { images: true } },
      },
    }),
    prisma.note.count({ where }),
  ]);

  return paginate(rows, total, params);
}

// --- PYQs ------------------------------------------------------------------

export async function listPyqs(params: ListParams) {
  const where: Prisma.PyqWhereInput = {
    ...(params.q
      ? { OR: [{ title: insensitive(params.q) }, { examSession: insensitive(params.q) }] }
      : {}),
    ...(params.filters.subjectId ? { subjectId: params.filters.subjectId } : {}),
    ...(params.filters.year ? { year: Number.parseInt(params.filters.year, 10) } : {}),
    ...(params.filters.status
      ? { status: params.filters.status as Prisma.EnumContentStatusFilter['equals'] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.pyq.findMany({
      where,
      orderBy: buildOrderBy(params.sort, params.dir) as Prisma.PyqOrderByWithRelationInput,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        subject: { include: { class: { include: { board: true } } } },
        chapter: true,
        questionFile: true,
        solutionFile: true,
      },
    }),
    prisma.pyq.count({ where }),
  ]);

  return paginate(rows, total, params);
}

// --- Quizzes ---------------------------------------------------------------

export async function listQuizzes(params: ListParams) {
  const where: Prisma.QuizWhereInput = {
    ...(params.q
      ? { OR: [{ title: insensitive(params.q) }, { slug: insensitive(params.q) }] }
      : {}),
    ...(params.filters.subjectId ? { subjectId: params.filters.subjectId } : {}),
    ...(params.filters.status
      ? { status: params.filters.status as Prisma.EnumContentStatusFilter['equals'] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      orderBy: buildOrderBy(params.sort, params.dir) as Prisma.QuizOrderByWithRelationInput,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        subject: { include: { class: { include: { board: true } } } },
        chapter: true,
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    prisma.quiz.count({ where }),
  ]);

  return paginate(rows, total, params);
}

export async function getQuizWithQuestions(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
    include: {
      subject: { include: { class: { include: { board: true } } } },
      chapter: true,
      questions: { orderBy: { displayOrder: 'asc' } },
      _count: { select: { attempts: true } },
    },
  });
}

// --- Option lists used by forms and filters --------------------------------

export async function getFormOptions() {
  const [boards, classes, streams, subjects, chapters] = await Promise.all([
    prisma.board.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.class.findMany({
      orderBy: [{ board: { displayOrder: 'asc' } }, { level: 'asc' }],
      select: { id: true, name: true, level: true, boardId: true },
    }),
    prisma.stream.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, boardId: true },
    }),
    prisma.subject.findMany({
      orderBy: [{ class: { level: 'asc' } }, { displayOrder: 'asc' }],
      select: {
        id: true, name: true, code: true, classId: true, streamId: true,
        class: { select: { name: true, boardId: true } },
      },
    }),
    prisma.chapter.findMany({
      orderBy: [{ subjectId: 'asc' }, { number: 'asc' }],
      select: { id: true, title: true, number: true, subjectId: true },
    }),
  ]);

  return { boards, classes, streams, subjects, chapters };
}

export type FormOptions = Awaited<ReturnType<typeof getFormOptions>>;

/** Distinct PYQ years, for the year filter. */
export async function getPyqYears() {
  const rows = await prisma.pyq.findMany({
    distinct: ['year'],
    orderBy: { year: 'desc' },
    select: { year: true },
  });
  return rows.map((row) => row.year);
}

/** Recently added content across all three content types, for the dashboard. */
export async function getRecentContent(limit = 8) {
  const [notes, pyqs, quizzes] = await Promise.all([
    prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, status: true, createdAt: true,
        chapter: { select: { title: true, subject: { select: { name: true } } } },
      },
    }),
    prisma.pyq.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, status: true, createdAt: true, year: true,
        subject: { select: { name: true } },
      },
    }),
    prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, status: true, createdAt: true,
        subject: { select: { name: true } },
        _count: { select: { questions: true } },
      },
    }),
  ]);

  const items = [
    ...notes.map((n) => ({
      id: n.id, kind: 'Note' as const, title: n.title, status: n.status,
      createdAt: n.createdAt, context: `${n.chapter.subject.name} · ${n.chapter.title}`,
      href: '/admin/notes',
    })),
    ...pyqs.map((p) => ({
      id: p.id, kind: 'PYQ' as const, title: p.title, status: p.status,
      createdAt: p.createdAt, context: `${p.subject.name} · ${p.year}`,
      href: '/admin/pyqs',
    })),
    ...quizzes.map((q) => ({
      id: q.id, kind: 'Quiz' as const, title: q.title, status: q.status,
      createdAt: q.createdAt, context: `${q.subject.name} · ${q._count.questions} questions`,
      href: `/admin/quizzes/${q.id}`,
    })),
  ];

  return items
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
