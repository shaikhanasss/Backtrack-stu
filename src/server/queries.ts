import 'server-only';

import { prisma } from '@/lib/prisma';
import { percentage } from '@/lib/utils';

/**
 * Read-side data access. Every figure the UI displays comes from one of these
 * functions — nothing on screen is hardcoded.
 */

/** Boards with the amount of published content beneath them. */
export async function getBoardsOverview() {
  const boards = await prisma.board.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      classes: {
        orderBy: { level: 'asc' },
        include: {
          _count: { select: { subjects: true } },
        },
      },
      streams: { orderBy: { name: 'asc' } },
    },
  });

  // Count published notes per board in a single grouped query.
  const noteCounts = await prisma.note.groupBy({
    by: ['chapterId'],
    where: { status: 'PUBLISHED' },
    _count: { _all: true },
  });

  const totalPublishedNotes = noteCounts.reduce((sum, r) => sum + r._count._all, 0);

  return { boards, totalPublishedNotes };
}

/** Aggregate counts used on the public landing page. */
export async function getPlatformStats() {
  const [notes, pyqs, quizzes, subjects] = await Promise.all([
    prisma.note.count({ where: { status: 'PUBLISHED' } }),
    prisma.pyq.count({ where: { status: 'PUBLISHED' } }),
    prisma.quiz.count({ where: { status: 'PUBLISHED' } }),
    prisma.subject.count(),
  ]);

  return { notes, pyqs, quizzes, subjects };
}

/**
 * The dashboard's progress panel. The prototype hardcoded 70%, "45", "18/20"
 * and a 7-day streak; these are computed from the student's real rows.
 */
export async function getStudentDashboard(userId: string) {
  const [user, completedNotes, inProgressNotes, publishedNotes, lastAttempt, attemptCount, bookmarkCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          currentStreak: true,
          longestStreak: true,
          board: { select: { name: true } },
          class: { select: { name: true } },
          stream: { select: { name: true } },
        },
      }),
      prisma.noteProgress.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.noteProgress.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.note.count({ where: { status: 'PUBLISHED' } }),
      prisma.quizAttempt.findFirst({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        select: { score: true, totalQuestions: true, quiz: { select: { title: true } } },
      }),
      prisma.quizAttempt.count({ where: { userId, completedAt: { not: null } } }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

  return {
    user,
    completedNotes,
    inProgressNotes,
    publishedNotes,
    completionPercent: percentage(completedNotes, publishedNotes),
    lastAttempt,
    attemptCount,
    bookmarkCount,
  };
}

/** Subjects grouped for the notes browser. */
export async function getSubjectsWithChapterCounts() {
  return prisma.subject.findMany({
    orderBy: [{ class: { level: 'asc' } }, { displayOrder: 'asc' }],
    include: {
      class: { include: { board: true } },
      stream: true,
      _count: { select: { chapters: true, pyqs: true, quizzes: true } },
    },
  });
}

/** Published PYQ papers, newest first. */
export async function getPublishedPyqs() {
  return prisma.pyq.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ year: 'desc' }, { title: 'asc' }],
    include: {
      subject: { include: { class: { include: { board: true } } } },
    },
  });
}

/** Published quizzes with their question counts. */
export async function getPublishedQuizzes() {
  return prisma.quiz.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { title: 'asc' },
    include: {
      subject: { include: { class: { include: { board: true } } } },
      chapter: true,
      _count: { select: { questions: true } },
    },
  });
}

/**
 * Case-insensitive search across published notes and PYQs.
 * Backs the landing page's search box, which was inert in the prototype.
 */
export async function searchContent(query: string) {
  const q = query.trim();
  if (q.length < 2) return { notes: [], pyqs: [], query: q };

  const [notes, pyqs] = await Promise.all([
    prisma.note.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
          { chapter: { title: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 20,
      include: {
        chapter: { include: { subject: { include: { class: true } } } },
      },
    }),
    prisma.pyq.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { examSession: { contains: q, mode: 'insensitive' } },
          { subject: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 20,
      include: { subject: { include: { class: true } } },
    }),
  ]);

  return { notes, pyqs, query: q };
}

/** Counts for the admin dashboard. */
export async function getAdminStats() {
  const [users, students, admins, boards, subjects, chapters, notes, publishedNotes, pyqs, quizzes, questions, attempts] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.board.count(),
      prisma.subject.count(),
      prisma.chapter.count(),
      prisma.note.count(),
      prisma.note.count({ where: { status: 'PUBLISHED' } }),
      prisma.pyq.count(),
      prisma.quiz.count(),
      prisma.quizQuestion.count(),
      prisma.quizAttempt.count(),
    ]);

  return {
    users, students, admins, boards, subjects, chapters,
    notes, publishedNotes, pyqs, quizzes, questions, attempts,
  };
}

/**
 * Board / class / stream options for the profile form.
 * Streams are nested under their board so the client can hide the stream field
 * entirely for boards that have none (i.e. SSC).
 */
export async function getAcademicOptions() {
  return prisma.board.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      classes: {
        orderBy: { level: 'asc' },
        select: { id: true, name: true, level: true },
      },
      streams: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      },
    },
  });
}

export type AcademicOptions = Awaited<ReturnType<typeof getAcademicOptions>>;

/** Paginated user list for the admin user-management screen. */
export async function getAdminUsers(limit = 50) {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      image: true,
      createdAt: true,
      currentStreak: true,
      board: { select: { name: true } },
      class: { select: { name: true } },
      stream: { select: { name: true } },
      _count: { select: { quizAttempts: true, noteProgress: true } },
    },
  });
}
