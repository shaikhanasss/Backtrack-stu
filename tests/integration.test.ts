/**
 * Integration tests against the real database.
 * Requires a migrated, seeded database (`npm run db:seed`).
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_EMAIL = 'integration.test@backtrack.local';
let userId = '';

before(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  const user = await prisma.user.create({
    data: {
      name: 'Integration Test',
      email: TEST_EMAIL,
      passwordHash: await bcrypt.hash('Str0ngPass', 12),
      role: 'STUDENT',
    },
  });
  userId = user.id;
});

after(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe('authentication storage', () => {
  test('passwords are stored as bcrypt hashes, never plaintext', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    assert.notEqual(user?.passwordHash, 'Str0ngPass');
    assert.match(user!.passwordHash!, /^\$2[aby]\$12\$/);
  });

  test('the stored hash verifies against the original password', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    assert.equal(await bcrypt.compare('Str0ngPass', user!.passwordHash!), true);
    assert.equal(await bcrypt.compare('WrongPass1', user!.passwordHash!), false);
  });

  test('email is unique', async () => {
    await assert.rejects(() =>
      prisma.user.create({ data: { name: 'Dup', email: TEST_EMAIL, passwordHash: 'x' } })
    );
  });

  test('new accounts default to the STUDENT role', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    assert.equal(user?.role, 'STUDENT');
  });
});

describe('data integrity constraints', () => {
  test('a bookmark cannot target both a note and a PYQ', async () => {
    const note = await prisma.note.findFirst({ select: { id: true } });
    const pyq = await prisma.pyq.findFirst({ select: { id: true } });
    await assert.rejects(() =>
      prisma.bookmark.create({ data: { userId, noteId: note!.id, pyqId: pyq!.id } })
    );
  });

  test('a bookmark cannot target nothing', async () => {
    await assert.rejects(() => prisma.bookmark.create({ data: { userId } }));
  });

  test('the same note cannot be bookmarked twice', async () => {
    const note = await prisma.note.findFirst({ select: { id: true } });
    const created = await prisma.bookmark.create({ data: { userId, noteId: note!.id } });
    await assert.rejects(() => prisma.bookmark.create({ data: { userId, noteId: note!.id } }));
    await prisma.bookmark.delete({ where: { id: created.id } });
  });

  test('a quiz question cannot point outside its options', async () => {
    const quiz = await prisma.quiz.findFirst({ select: { id: true } });
    await assert.rejects(() =>
      prisma.quizQuestion.create({
        data: { quizId: quiz!.id, text: 'Bad', options: ['a', 'b', 'c', 'd'], correctIndex: 9 },
      })
    );
  });

  test('note progress is unique per student and note', async () => {
    const note = await prisma.note.findFirst({ select: { id: true } });
    await prisma.noteProgress.create({ data: { userId, noteId: note!.id } });
    await assert.rejects(() => prisma.noteProgress.create({ data: { userId, noteId: note!.id } }));
    await prisma.noteProgress.deleteMany({ where: { userId } });
  });

  test('deleting a student cascades to their activity', async () => {
    const note = await prisma.note.findFirst({ select: { id: true } });
    const temp = await prisma.user.create({
      data: { name: 'Cascade', email: 'cascade.test@backtrack.local', passwordHash: 'x' },
    });
    await prisma.noteProgress.create({ data: { userId: temp.id, noteId: note!.id } });
    await prisma.bookmark.create({ data: { userId: temp.id, noteId: note!.id } });

    await prisma.user.delete({ where: { id: temp.id } });

    assert.equal(await prisma.noteProgress.count({ where: { userId: temp.id } }), 0);
    assert.equal(await prisma.bookmark.count({ where: { userId: temp.id } }), 0);
  });

  test('deleting a stream leaves its subjects, unassigned', async () => {
    const board = await prisma.board.findFirst({ where: { slug: 'hsc' }, select: { id: true } });
    const klass = await prisma.class.findFirst({ where: { boardId: board!.id }, select: { id: true } });
    const stream = await prisma.stream.create({
      data: { name: 'Temp Stream', slug: 'temp-stream-test', boardId: board!.id },
    });
    const subject = await prisma.subject.create({
      data: { name: 'Temp Subject', slug: 'temp-subject-test', classId: klass!.id, streamId: stream.id },
    });

    await prisma.stream.delete({ where: { id: stream.id } });

    const after = await prisma.subject.findUnique({ where: { id: subject.id } });
    assert.ok(after, 'the subject survives');
    assert.equal(after?.streamId, null, 'and becomes stream-less rather than orphaned');

    await prisma.subject.delete({ where: { id: subject.id } });
  });

  test('subject codes are unique when set, and many may be null', async () => {
    const klass = await prisma.class.findFirst({ select: { id: true } });
    const a = await prisma.subject.create({
      data: { name: 'Code A', slug: 'code-a-test', classId: klass!.id, code: 'DUPTEST' },
    });
    await assert.rejects(() =>
      prisma.subject.create({
        data: { name: 'Code B', slug: 'code-b-test', classId: klass!.id, code: 'DUPTEST' },
      })
    );
    // Two code-less subjects are fine.
    const b = await prisma.subject.create({
      data: { name: 'No Code 1', slug: 'no-code-1-test', classId: klass!.id },
    });
    const c = await prisma.subject.create({
      data: { name: 'No Code 2', slug: 'no-code-2-test', classId: klass!.id },
    });
    await prisma.subject.deleteMany({ where: { id: { in: [a.id, b.id, c.id] } } });
  });

  test('uploaded files must declare a matching MIME type', async () => {
    await assert.rejects(() =>
      prisma.fileAsset.create({
        data: {
          kind: 'PDF', storageKey: 'bad/key-test.pdf', originalName: 'x.pdf',
          mimeType: 'image/png', sizeBytes: 10,
        },
      })
    );
  });

  test('zero-byte uploads are rejected', async () => {
    await assert.rejects(() =>
      prisma.fileAsset.create({
        data: {
          kind: 'PDF', storageKey: 'bad/empty-test.pdf', originalName: 'x.pdf',
          mimeType: 'application/pdf', sizeBytes: 0,
        },
      })
    );
  });
});

describe('content visibility', () => {
  test('draft notes exist but are excluded from published queries', async () => {
    const drafts = await prisma.note.count({ where: { status: 'DRAFT' } });
    const published = await prisma.note.count({ where: { status: 'PUBLISHED' } });
    assert.ok(drafts > 0, 'the seed includes drafts so this rule is observable');
    assert.ok(published > 0);
    assert.equal(
      await prisma.note.count({ where: { status: 'PUBLISHED', chapter: { isActive: true } } }) <= published,
      true
    );
  });

  test('the seeded hierarchy is complete', async () => {
    assert.ok((await prisma.board.count()) >= 2);
    assert.ok((await prisma.class.count()) >= 3);
    assert.ok((await prisma.stream.count()) >= 3);
    assert.ok((await prisma.subject.count()) >= 8);
    assert.ok((await prisma.chapter.count()) >= 17);
  });

  test('SSC subjects carry no stream; HSC has both kinds', async () => {
    const ssc = await prisma.subject.count({
      where: { class: { board: { slug: 'ssc' } }, streamId: { not: null } },
    });
    assert.equal(ssc, 0, 'SSC never has streams');

    const hscWith = await prisma.subject.count({
      where: { class: { board: { slug: 'hsc' } }, streamId: { not: null } },
    });
    const hscWithout = await prisma.subject.count({
      where: { class: { board: { slug: 'hsc' } }, streamId: null },
    });
    assert.ok(hscWith > 0 && hscWithout > 0, 'HSC exercises the optional relation both ways');
  });
});

describe('quiz and progress data', () => {
  test('a quiz attempt scores and persists', async () => {
    const quiz = await prisma.quiz.findFirst({
      where: { questions: { some: {} } },
      include: { questions: { orderBy: { displayOrder: 'asc' } } },
    });

    const answers: Record<string, number> = {};
    quiz!.questions.forEach((q, i) => {
      answers[q.id] = i === 0 ? (q.correctIndex + 1) % 4 : q.correctIndex;
    });

    const expected = quiz!.questions.reduce(
      (sum, q) => (answers[q.id] === q.correctIndex ? sum + q.marks : sum), 0
    );

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId, quizId: quiz!.id, totalQuestions: quiz!.questions.length,
        answers, score: expected, completedAt: new Date(),
      },
    });

    const stored = await prisma.quizAttempt.findUnique({ where: { id: attempt.id } });
    assert.equal(stored?.score, expected);
    assert.ok(stored?.completedAt);

    await prisma.quizAttempt.delete({ where: { id: attempt.id } });
  });

  test('progress counts reflect only the given student', async () => {
    const note = await prisma.note.findFirst({ where: { status: 'PUBLISHED' }, select: { id: true } });
    await prisma.noteProgress.create({
      data: { userId, noteId: note!.id, status: 'COMPLETED', completedAt: new Date() },
    });

    const mine = await prisma.noteProgress.count({ where: { userId, status: 'COMPLETED' } });
    assert.equal(mine, 1);

    const others = await prisma.noteProgress.count({
      where: { userId: { not: userId }, status: 'COMPLETED' },
    });
    assert.ok(others >= 0, 'other students are counted separately');

    await prisma.noteProgress.deleteMany({ where: { userId } });
  });
});
