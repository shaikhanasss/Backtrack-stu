import 'server-only';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { percentage } from '@/lib/utils';

/**
 * Read side for the student app.
 *
 * Two rules hold throughout: students only ever see PUBLISHED content and
 * active hierarchy rows, and every figure is computed from the database — the
 * prototype's hardcoded "45 / 18-20 / 🔥7" have no equivalent here.
 */

/** Only published material, hanging off an active chapter/subject/class/board. */
const VISIBLE_NOTE: Prisma.NoteWhereInput = {
  status: 'PUBLISHED',
  chapter: {
    isActive: true,
    subject: {
      isActive: true,
      class: { isActive: true, board: { isActive: true } },
    },
  },
};

const VISIBLE_SUBJECT: Prisma.SubjectWhereInput = {
  isActive: true,
  class: { isActive: true, board: { isActive: true } },
};

// ---------------------------------------------------------------------------
// Academic navigation
// ---------------------------------------------------------------------------

export async function getBrowseBoards() {
  return prisma.board.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true, name: true, slug: true, icon: true, description: true,
      _count: { select: { classes: true, streams: true } },
      classes: {
        where: { isActive: true },
        orderBy: { level: 'asc' },
        select: { id: true, name: true, slug: true, level: true },
      },
    },
  });
}

export async function getBoardBySlug(slug: string) {
  return prisma.board.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true, name: true, slug: true, icon: true, description: true,
      classes: {
        where: { isActive: true },
        orderBy: { level: 'asc' },
        select: {
          id: true, name: true, slug: true, level: true,
          _count: { select: { subjects: true } },
        },
      },
      streams: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, icon: true },
      },
    },
  });
}

/**
 * Subjects for a class, optionally narrowed to one stream.
 *
 * `streamSlug === 'general'` selects the stream-less subjects — the only kind
 * SSC has, and the ones HSC shares across every stream (English, for example).
 */
export async function getClassWithSubjects(
  boardSlug: string,
  classSlug: string,
  streamSlug?: string
) {
  const klass = await prisma.class.findFirst({
    where: { slug: classSlug, isActive: true, board: { slug: boardSlug, isActive: true } },
    select: {
      id: true, name: true, slug: true, level: true,
      board: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!klass) return null;

  const streams = await prisma.stream.findMany({
    where: {
      isActive: true,
      boardId: klass.board.id,
      subjects: { some: { classId: klass.id, isActive: true } },
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, icon: true },
  });

  const hasGeneral = await prisma.subject.count({
    where: { classId: klass.id, streamId: null, isActive: true },
  });

  let streamFilter: Prisma.SubjectWhereInput = {};
  let activeStream: { name: string; slug: string } | null = null;

  if (streamSlug === 'general') {
    streamFilter = { streamId: null };
    activeStream = { name: 'Common subjects', slug: 'general' };
  } else if (streamSlug) {
    const stream = streams.find((s) => s.slug === streamSlug);
    if (!stream) return null;
    streamFilter = { streamId: stream.id };
    activeStream = { name: stream.name, slug: stream.slug };
  }

  const subjects = await prisma.subject.findMany({
    where: { classId: klass.id, isActive: true, ...streamFilter },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, slug: true, code: true, icon: true, description: true,
      stream: { select: { name: true, slug: true } },
      _count: { select: { chapters: true, pyqs: true, quizzes: true } },
    },
  });

  return { klass, streams, hasGeneral: hasGeneral > 0, activeStream, subjects };
}

export async function getSubjectWithChapters(subjectId: string, userId: string) {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, ...VISIBLE_SUBJECT },
    select: {
      id: true, name: true, code: true, icon: true, description: true,
      stream: { select: { name: true } },
      class: {
        select: {
          id: true, name: true, slug: true,
          board: { select: { name: true, slug: true } },
        },
      },
      chapters: {
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { number: 'asc' }],
        select: {
          id: true, number: true, title: true, description: true,
          _count: { select: { notes: { where: { status: 'PUBLISHED' } } } },
          notes: {
            where: { status: 'PUBLISHED' },
            select: {
              id: true,
              progress: { where: { userId }, select: { status: true } },
            },
          },
        },
      },
      _count: { select: { pyqs: true, quizzes: true } },
    },
  });
  if (!subject) return null;

  // Fold each chapter's per-note progress into a single completed count.
  const chapters = subject.chapters.map((chapter) => ({
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    description: chapter.description,
    noteCount: chapter._count.notes,
    completedCount: chapter.notes.filter((n) => n.progress[0]?.status === 'COMPLETED').length,
  }));

  return { ...subject, chapters };
}

export async function getChapterWithMaterial(chapterId: string, userId: string) {
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      isActive: true,
      subject: VISIBLE_SUBJECT,
    },
    select: {
      id: true, number: true, title: true, description: true,
      subject: {
        select: {
          id: true, name: true, icon: true,
          stream: { select: { name: true } },
          class: {
            select: {
              name: true, slug: true,
              board: { select: { name: true, slug: true } },
            },
          },
        },
      },
      notes: {
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, title: true, summary: true, viewCount: true,
          pdfFileId: true, thumbnailFileId: true,
          _count: { select: { images: true } },
          progress: { where: { userId }, select: { status: true, lastReadAt: true } },
          bookmarks: { where: { userId }, select: { id: true } },
        },
      },
      quizzes: {
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, durationMin: true, _count: { select: { questions: true } } },
      },
      pyqs: {
        where: { status: 'PUBLISHED' },
        orderBy: { year: 'desc' },
        select: { id: true, title: true, year: true },
      },
    },
  });

  return chapter;
}

// ---------------------------------------------------------------------------
// Study material
// ---------------------------------------------------------------------------

export async function getNoteForStudent(noteId: string, userId: string) {
  return prisma.note.findFirst({
    where: { id: noteId, ...VISIBLE_NOTE },
    select: {
      id: true, title: true, summary: true, content: true, viewCount: true,
      pdfFile: { select: { id: true, originalName: true, sizeBytes: true } },
      thumbnailFile: { select: { id: true } },
      images: {
        orderBy: { displayOrder: 'asc' },
        select: { id: true, caption: true, file: { select: { id: true, originalName: true } } },
      },
      chapter: {
        select: {
          id: true, number: true, title: true,
          subject: {
            select: {
              id: true, name: true, icon: true,
              class: { select: { name: true, slug: true, board: { select: { name: true, slug: true } } } },
            },
          },
        },
      },
      progress: { where: { userId }, select: { status: true, lastReadAt: true, completedAt: true } },
      bookmarks: { where: { userId }, select: { id: true } },
    },
  });
}

/** Sibling material in the same chapter, for previous/next links. */
export async function getChapterSiblings(chapterId: string, noteId: string) {
  const notes = await prisma.note.findMany({
    where: { chapterId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true },
  });
  const index = notes.findIndex((n) => n.id === noteId);
  return {
    previous: index > 0 ? notes[index - 1] : null,
    next: index >= 0 && index < notes.length - 1 ? notes[index + 1] : null,
    position: index + 1,
    total: notes.length,
  };
}

// ---------------------------------------------------------------------------
// PYQs
// ---------------------------------------------------------------------------

export async function getStudentPyqs(
  userId: string,
  filters: { q?: string; boardId?: string; classId?: string; subjectId?: string; chapterId?: string; year?: string }
) {
  const where: Prisma.PyqWhereInput = {
    status: 'PUBLISHED',
    subject: VISIBLE_SUBJECT,
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: 'insensitive' } },
            { examSession: { contains: filters.q, mode: 'insensitive' } },
            { subject: { name: { contains: filters.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.chapterId ? { chapterId: filters.chapterId } : {}),
    ...(filters.classId ? { subject: { ...VISIBLE_SUBJECT, classId: filters.classId } } : {}),
    ...(filters.boardId
      ? { subject: { ...VISIBLE_SUBJECT, class: { isActive: true, boardId: filters.boardId, board: { isActive: true } } } }
      : {}),
    ...(filters.year ? { year: Number.parseInt(filters.year, 10) } : {}),
  };

  const [rows, years] = await Promise.all([
    prisma.pyq.findMany({
      where,
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
      take: 100,
      select: {
        id: true, title: true, year: true, examSession: true, description: true,
        questionFileId: true, solutionFileId: true, downloadCount: true,
        chapter: { select: { number: true, title: true } },
        subject: {
          select: {
            id: true, name: true,
            class: { select: { name: true, board: { select: { name: true } } } },
          },
        },
        bookmarks: { where: { userId }, select: { id: true } },
      },
    }),
    prisma.pyq.findMany({
      where: { status: 'PUBLISHED' },
      distinct: ['year'],
      orderBy: { year: 'desc' },
      select: { year: true },
    }),
  ]);

  return { rows, years: years.map((y) => y.year) };
}

/** Board/class/subject option lists for the student filter bars. */
export async function getStudentFilterOptions() {
  const [boards, classes, subjects] = await Promise.all([
    prisma.board.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.class.findMany({
      where: { isActive: true, board: { isActive: true } },
      orderBy: [{ board: { displayOrder: 'asc' } }, { level: 'asc' }],
      select: { id: true, name: true, boardId: true },
    }),
    prisma.subject.findMany({
      where: VISIBLE_SUBJECT,
      orderBy: [{ class: { level: 'asc' } }, { displayOrder: 'asc' }],
      select: {
        id: true, name: true, classId: true,
        class: { select: { name: true, boardId: true } },
      },
    }),
  ]);

  return { boards, classes, subjects };
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export async function getStudentQuizzes(userId: string, filters: { q?: string; subjectId?: string }) {
  return prisma.quiz.findMany({
    where: {
      status: 'PUBLISHED',
      questions: { some: {} },
      subject: VISIBLE_SUBJECT,
      ...(filters.q ? { title: { contains: filters.q, mode: 'insensitive' } } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    },
    orderBy: { title: 'asc' },
    select: {
      id: true, title: true, description: true, durationMin: true, passingScore: true,
      chapter: { select: { number: true, title: true } },
      subject: {
        select: { id: true, name: true, icon: true, class: { select: { name: true, board: { select: { name: true } } } } },
      },
      _count: { select: { questions: true } },
      attempts: {
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 1,
        select: { id: true, score: true, totalQuestions: true, completedAt: true },
      },
    },
  });
}

export async function getQuizIntro(quizId: string, userId: string) {
  return prisma.quiz.findFirst({
    where: { id: quizId, status: 'PUBLISHED', subject: VISIBLE_SUBJECT },
    select: {
      id: true, title: true, description: true, durationMin: true, passingScore: true,
      chapter: { select: { number: true, title: true } },
      subject: {
        select: { id: true, name: true, icon: true, class: { select: { name: true, board: { select: { name: true } } } } },
      },
      questions: { select: { marks: true } },
      attempts: {
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        select: { id: true, score: true, totalQuestions: true, completedAt: true, timeTakenSec: true },
      },
    },
  });
}

/**
 * The attempt as the student is allowed to see it.
 *
 * `correctIndex` and `explanation` are deliberately NOT selected: sending them
 * to the browser mid-attempt would put the answer key in devtools.
 */
export async function getAttemptForPlaying(attemptId: string, userId: string) {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    select: {
      id: true, startedAt: true, completedAt: true, answers: true,
      quiz: {
        select: {
          id: true, title: true, durationMin: true,
          subject: { select: { name: true } },
          chapter: { select: { number: true, title: true } },
          questions: {
            orderBy: { displayOrder: 'asc' },
            select: { id: true, text: true, options: true, marks: true, difficulty: true },
          },
        },
      },
    },
  });
  return attempt;
}

/** The finished attempt, now including the answer key and explanations. */
export async function getAttemptResult(attemptId: string, userId: string) {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId, completedAt: { not: null } },
    select: {
      id: true, score: true, totalQuestions: true, answers: true,
      startedAt: true, completedAt: true, timeTakenSec: true,
      quiz: {
        select: {
          id: true, title: true, passingScore: true,
          subject: { select: { name: true, class: { select: { name: true } } } },
          chapter: { select: { number: true, title: true } },
          questions: {
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true, text: true, options: true, correctIndex: true,
              explanation: true, marks: true, difficulty: true,
            },
          },
        },
      },
    },
  });
  return attempt;
}

// ---------------------------------------------------------------------------
// Dashboard, progress, bookmarks
// ---------------------------------------------------------------------------

export async function getDashboardData(userId: string) {
  const [
    user, completedNotes, viewedNotes, publishedNotes, recentlyViewed,
    attempts, bookmarkCount, subjects, recentBookmarks,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true, image: true, currentStreak: true, longestStreak: true, lastActiveOn: true,
        board: { select: { id: true, name: true, slug: true } },
        class: { select: { id: true, name: true, slug: true } },
        stream: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.noteProgress.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.noteProgress.count({ where: { userId } }),
    prisma.note.count({ where: VISIBLE_NOTE }),
    prisma.noteProgress.findMany({
      where: { userId },
      orderBy: { lastReadAt: 'desc' },
      take: 6,
      select: {
        status: true, lastReadAt: true,
        note: {
          select: {
            id: true, title: true, summary: true,
            chapter: { select: { number: true, title: true, subject: { select: { name: true, icon: true } } } },
          },
        },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true, score: true, totalQuestions: true, completedAt: true,
        quiz: { select: { id: true, title: true, subject: { select: { name: true } } } },
      },
    }),
    prisma.bookmark.count({ where: { userId } }),
    prisma.subject.findMany({
      where: VISIBLE_SUBJECT,
      orderBy: [{ class: { level: 'asc' } }, { displayOrder: 'asc' }],
      take: 8,
      select: {
        id: true, name: true, icon: true, code: true,
        stream: { select: { name: true } },
        class: { select: { name: true, board: { select: { name: true } } } },
        _count: { select: { chapters: true } },
      },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true, createdAt: true,
        note: { select: { id: true, title: true } },
        pyq: { select: { id: true, title: true, year: true } },
      },
    }),
  ]);

  const scored = attempts.filter((a) => a.totalQuestions > 0);
  const averageScore = scored.length
    ? Math.round(
        scored.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / scored.length
      )
    : 0;
  const bestScore = scored.length
    ? Math.max(...scored.map((a) => Math.round((a.score / a.totalQuestions) * 100)))
    : 0;

  return {
    user,
    completedNotes,
    viewedNotes,
    publishedNotes,
    completionPercent: percentage(completedNotes, publishedNotes),
    recentlyViewed,
    continueLearning: recentlyViewed.filter((p) => p.status === 'IN_PROGRESS').slice(0, 3),
    attempts,
    attemptCount: attempts.length,
    lastAttempt: attempts[0] ?? null,
    averageScore,
    bestScore,
    bookmarkCount,
    recentBookmarks,
    subjects,
  };
}

/** Per-subject completion, used by the progress page. */
export async function getProgressBreakdown(userId: string) {
  const subjects = await prisma.subject.findMany({
    where: VISIBLE_SUBJECT,
    orderBy: [{ class: { level: 'asc' } }, { displayOrder: 'asc' }],
    select: {
      id: true, name: true, icon: true,
      stream: { select: { name: true } },
      class: { select: { name: true, board: { select: { name: true } } } },
      chapters: {
        where: { isActive: true },
        select: {
          notes: {
            where: { status: 'PUBLISHED' },
            select: { id: true, progress: { where: { userId }, select: { status: true } } },
          },
        },
      },
    },
  });

  return subjects
    .map((subject) => {
      const notes = subject.chapters.flatMap((c) => c.notes);
      const completed = notes.filter((n) => n.progress[0]?.status === 'COMPLETED').length;
      const viewed = notes.filter((n) => n.progress.length > 0).length;
      return {
        id: subject.id,
        name: subject.name,
        icon: subject.icon,
        context: `${subject.class.board.name} · ${subject.class.name}${
          subject.stream ? ` · ${subject.stream.name}` : ''
        }`,
        total: notes.length,
        completed,
        viewed,
        percent: percentage(completed, notes.length),
      };
    })
    .filter((s) => s.total > 0);
}

export async function getBookmarks(userId: string) {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, createdAt: true,
      note: {
        select: {
          id: true, title: true, summary: true,
          chapter: { select: { number: true, title: true, subject: { select: { name: true, icon: true } } } },
        },
      },
      pyq: {
        select: {
          id: true, title: true, year: true, questionFileId: true, solutionFileId: true,
          subject: { select: { name: true, class: { select: { name: true } } } },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------

export async function globalSearch(query: string, userId: string) {
  const q = query.trim();
  if (q.length < 2) {
    return { q, notes: [], chapters: [], subjects: [], pyqs: [], quizzes: [], total: 0 };
  }

  const like = { contains: q, mode: 'insensitive' as const };

  const [notes, chapters, subjects, pyqs, quizzes] = await Promise.all([
    prisma.note.findMany({
      where: {
        ...VISIBLE_NOTE,
        OR: [{ title: like }, { summary: like }, { content: like }],
      },
      take: 12,
      select: {
        id: true, title: true, summary: true,
        chapter: { select: { number: true, title: true, subject: { select: { name: true, icon: true } } } },
        bookmarks: { where: { userId }, select: { id: true } },
      },
    }),
    prisma.chapter.findMany({
      where: {
        isActive: true,
        subject: VISIBLE_SUBJECT,
        OR: [{ title: like }, { description: like }],
      },
      take: 8,
      select: {
        id: true, number: true, title: true,
        subject: { select: { name: true, icon: true, class: { select: { name: true } } } },
        _count: { select: { notes: { where: { status: 'PUBLISHED' } } } },
      },
    }),
    prisma.subject.findMany({
      where: { ...VISIBLE_SUBJECT, OR: [{ name: like }, { code: like }, { description: like }] },
      take: 8,
      select: {
        id: true, name: true, code: true, icon: true,
        stream: { select: { name: true } },
        class: { select: { name: true, board: { select: { name: true } } } },
        _count: { select: { chapters: true } },
      },
    }),
    prisma.pyq.findMany({
      where: {
        status: 'PUBLISHED',
        subject: VISIBLE_SUBJECT,
        OR: [{ title: like }, { examSession: like }, { description: like }],
      },
      take: 8,
      select: {
        id: true, title: true, year: true, questionFileId: true,
        subject: { select: { name: true, class: { select: { name: true } } } },
      },
    }),
    prisma.quiz.findMany({
      where: {
        status: 'PUBLISHED',
        questions: { some: {} },
        subject: VISIBLE_SUBJECT,
        OR: [{ title: like }, { description: like }],
      },
      take: 8,
      select: {
        id: true, title: true, durationMin: true,
        subject: { select: { name: true, icon: true } },
        _count: { select: { questions: true } },
      },
    }),
  ]);

  return {
    q,
    notes, chapters, subjects, pyqs, quizzes,
    total: notes.length + chapters.length + subjects.length + pyqs.length + quizzes.length,
  };
}
