/**
 * Seeds a small but realistic Maharashtra-board dataset.
 *
 * Structure created:
 *   SSC  -> Class 10  -> (no stream)  Mathematics, Science, English
 *   HSC  -> Class 11  -> Science      Physics
 *        -> Class 12  -> Science      Physics, Chemistry
 *                     -> Commerce     Book-Keeping & Accountancy
 *                     -> (no stream)  English  (common to all HSC streams)
 *
 * The stream-less HSC English subject is deliberate: it exercises the optional
 * `streamId` relation from both directions.
 *
 * Run with:  npm run db:seed
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@backtrack.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
const STUDENT_EMAIL = process.env.SEED_STUDENT_EMAIL ?? 'student@backtrack.local';
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD ?? 'Student@12345';

async function main() {
  console.log('Seeding BackTrack...\n');

  // --- Clean slate (child rows first, respecting foreign keys) -------------
  await prisma.noteImage.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.noteProgress.deleteMany();
  await prisma.note.deleteMany();
  await prisma.pyq.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.class.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.board.deleteMany();

  // --- Boards --------------------------------------------------------------
  const ssc = await prisma.board.create({
    data: {
      name: 'SSC',
      slug: 'ssc',
      icon: '📚',
      description: 'Maharashtra State Board — Secondary School Certificate (Class 10)',
      displayOrder: 1,
    },
  });

  const hsc = await prisma.board.create({
    data: {
      name: 'HSC',
      slug: 'hsc',
      icon: '🎓',
      description: 'Maharashtra State Board — Higher Secondary Certificate (Class 11-12)',
      displayOrder: 2,
    },
  });

  // --- Classes -------------------------------------------------------------
  const class10 = await prisma.class.create({
    data: { level: 10, name: 'Class 10', slug: 'class-10', boardId: ssc.id },
  });
  const class11 = await prisma.class.create({
    data: { level: 11, name: 'Class 11', slug: 'class-11', boardId: hsc.id },
  });
  const class12 = await prisma.class.create({
    data: { level: 12, name: 'Class 12', slug: 'class-12', boardId: hsc.id },
  });

  // --- Streams (HSC only; SSC deliberately has none) -----------------------
  const science = await prisma.stream.create({
    data: { name: 'Science', slug: 'science', icon: '🔬', boardId: hsc.id },
  });
  const commerce = await prisma.stream.create({
    data: { name: 'Commerce', slug: 'commerce', icon: '📊', boardId: hsc.id },
  });
  await prisma.stream.create({
    data: { name: 'Arts', slug: 'arts', icon: '🎨', boardId: hsc.id },
  });

  // --- Subjects ------------------------------------------------------------
  // SSC subjects carry streamId = null.
  const sscMaths = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      slug: 'mathematics',
      code: 'MATH10',
      icon: '➗',
      classId: class10.id,
      displayOrder: 1,
      description: 'Algebra and Geometry for Class 10.',
    },
  });
  const sscScience = await prisma.subject.create({
    data: {
      name: 'Science and Technology',
      slug: 'science-and-technology',
      code: 'SCI10',
      icon: '🔬',
      classId: class10.id,
      displayOrder: 2,
      description: 'Physics, Chemistry and Biology fundamentals.',
    },
  });
  const sscEnglish = await prisma.subject.create({
    data: {
      name: 'English',
      slug: 'english',
      code: 'ENG10',
      icon: '📘',
      classId: class10.id,
      displayOrder: 3,
    },
  });

  const hsc11Physics = await prisma.subject.create({
    data: {
      name: 'Physics',
      slug: 'physics',
      code: 'PHY11',
      icon: '⚛️',
      classId: class11.id,
      streamId: science.id,
      displayOrder: 1,
    },
  });
  const hsc12Physics = await prisma.subject.create({
    data: {
      name: 'Physics',
      slug: 'physics',
      code: 'PHY12',
      icon: '⚛️',
      classId: class12.id,
      streamId: science.id,
      displayOrder: 1,
    },
  });
  const hsc12Chemistry = await prisma.subject.create({
    data: {
      name: 'Chemistry',
      slug: 'chemistry',
      code: 'CHEM12',
      icon: '🧪',
      classId: class12.id,
      streamId: science.id,
      displayOrder: 2,
    },
  });
  const hsc12Accounts = await prisma.subject.create({
    data: {
      name: 'Book-Keeping & Accountancy',
      slug: 'book-keeping-and-accountancy',
      code: 'BK12',
      icon: '📒',
      classId: class12.id,
      streamId: commerce.id,
      displayOrder: 1,
    },
  });
  // Common to every HSC stream, so no stream is attached.
  const hsc12English = await prisma.subject.create({
    data: {
      name: 'English',
      slug: 'english',
      code: 'ENG12',
      icon: '📘',
      classId: class12.id,
      displayOrder: 3,
      description: 'Compulsory across all HSC streams.',
    },
  });

  // --- Chapters ------------------------------------------------------------
  const chapterSpec: { subjectId: string; items: [number, string][] }[] = [
    {
      subjectId: sscMaths.id,
      items: [
        [1, 'Linear Equations in Two Variables'],
        [2, 'Quadratic Equations'],
        [3, 'Arithmetic Progression'],
        [4, 'Similarity'],
      ],
    },
    {
      subjectId: sscScience.id,
      items: [
        [1, 'Gravitation'],
        [2, 'Periodic Classification of Elements'],
        [3, 'Chemical Reactions and Equations'],
      ],
    },
    { subjectId: sscEnglish.id, items: [[1, 'Where the Mind is Without Fear']] },
    {
      subjectId: hsc11Physics.id,
      items: [
        [1, 'Units and Measurements'],
        [2, 'Motion in a Plane'],
      ],
    },
    {
      subjectId: hsc12Physics.id,
      items: [
        [1, 'Rotational Dynamics'],
        [2, 'Mechanical Properties of Fluids'],
        [3, 'Current Electricity'],
      ],
    },
    {
      subjectId: hsc12Chemistry.id,
      items: [
        [1, 'Solid State'],
        [2, 'Solutions'],
      ],
    },
    { subjectId: hsc12Accounts.id, items: [[1, 'Introduction to Partnership']] },
    { subjectId: hsc12English.id, items: [[1, 'An Astrologer’s Day']] },
  ];

  const chapters: { id: string; title: string; number: number; subjectId: string }[] = [];

  for (const spec of chapterSpec) {
    for (const [number, title] of spec.items) {
      const chapter = await prisma.chapter.create({
        data: {
          number,
          displayOrder: number,
          title,
          slug: title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-'),
          subjectId: spec.subjectId,
        },
        select: { id: true, title: true, number: true, subjectId: true },
      });
      chapters.push(chapter);
    }
  }

  // --- Notes ---------------------------------------------------------------
  // Most notes are published; two are left as DRAFT so the editorial workflow
  // is visible (students must not see them).
  const noteData: Prisma.NoteCreateManyInput[] = chapters.map((chapter, index) => {
    const isDraft = index % 7 === 6;
    return {
      title: `${chapter.title} — Notes`,
      slug: 'notes',
      summary: `Concise revision notes covering ${chapter.title}.`,
      content: `# ${chapter.title}\n\nKey definitions, derivations and solved examples for ${chapter.title}.`,
      chapterId: chapter.id,
      status: isDraft ? 'DRAFT' : 'PUBLISHED',
      publishedAt: isDraft ? null : new Date(),
      // No files are seeded: uploading through the admin panel is what creates
      // FileAsset rows, and pointing at bytes that do not exist would be worse
      // than leaving the attachment empty.
    };
  });
  await prisma.note.createMany({ data: noteData });

  // --- PYQs ----------------------------------------------------------------
  const pyqSubjects = [
    { subject: sscMaths, label: 'Mathematics Part I' },
    { subject: sscScience, label: 'Science and Technology Part I' },
    { subject: hsc12Physics, label: 'Physics' },
    { subject: hsc12Chemistry, label: 'Chemistry' },
    { subject: hsc12Accounts, label: 'Book-Keeping & Accountancy' },
  ];

  const pyqRows: Prisma.PyqCreateManyInput[] = [];
  for (const { subject, label } of pyqSubjects) {
    for (const year of [2023, 2024, 2025]) {
      pyqRows.push({
        title: `${label} — March ${year}`,
        year,
        examSession: `March ${year} Board Examination`,
        subjectId: subject.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        description: `Full ${label} question paper for the March ${year} board examination.`,
      });
    }
  }
  await prisma.pyq.createMany({ data: pyqRows });

  // One paper is filed against a single chapter, exercising the optional
  // Pyq -> Chapter link that most board papers leave null.
  const quadraticsChapter = chapters.find((c) => c.title === 'Quadratic Equations');
  if (quadraticsChapter) {
    await prisma.pyq.create({
      data: {
        title: 'Quadratic Equations — Topic-wise Questions',
        year: 2025,
        examSession: 'Topic compilation',
        description: 'Chapter-specific questions collected from past board papers.',
        subjectId: sscMaths.id,
        chapterId: quadraticsChapter.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  // One deactivated subject so the active/inactive filter has something to show.
  await prisma.subject.update({
    where: { id: hsc11Physics.id },
    data: { isActive: false },
  });

  // --- Quizzes -------------------------------------------------------------
  const quadratics = chapters.find((c) => c.title === 'Quadratic Equations')!;
  const gravitation = chapters.find((c) => c.title === 'Gravitation')!;
  const rotational = chapters.find((c) => c.title === 'Rotational Dynamics')!;

  const mathsQuiz = await prisma.quiz.create({
    data: {
      title: 'Quadratic Equations — Practice Quiz',
      slug: 'quadratic-equations-practice',
      description: 'Five questions on roots, discriminant and factorisation.',
      durationMin: 10,
      subjectId: sscMaths.id,
      chapterId: quadratics.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const scienceQuiz = await prisma.quiz.create({
    data: {
      title: 'Gravitation — Quick Test',
      slug: 'gravitation-quick-test',
      description: 'Newton’s law of gravitation and free fall.',
      durationMin: 8,
      subjectId: sscScience.id,
      chapterId: gravitation.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const physicsQuiz = await prisma.quiz.create({
    data: {
      title: 'Rotational Dynamics — Concept Check',
      slug: 'rotational-dynamics-concept-check',
      durationMin: 12,
      subjectId: hsc12Physics.id,
      chapterId: rotational.id,
      status: 'DRAFT', // left unpublished on purpose
    },
  });

  await prisma.quizQuestion.createMany({
    data: [
      {
        quizId: mathsQuiz.id,
        text: 'The standard form of a quadratic equation is:',
        options: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx = 0', 'a/x + b = 0'],
        correctIndex: 1,
        explanation: 'A quadratic equation has degree 2, written ax² + bx + c = 0 where a ≠ 0.',
        difficulty: 'EASY',
        displayOrder: 1,
      },
      {
        quizId: mathsQuiz.id,
        text: 'For the equation x² - 5x + 6 = 0, the roots are:',
        options: ['2 and 3', '-2 and -3', '1 and 6', '-1 and -6'],
        correctIndex: 0,
        explanation: 'Factorising gives (x - 2)(x - 3) = 0, so x = 2 or x = 3.',
        difficulty: 'EASY',
        displayOrder: 2,
      },
      {
        quizId: mathsQuiz.id,
        text: 'The discriminant of ax² + bx + c = 0 is:',
        options: ['b² + 4ac', 'b² - 4ac', '2a/b', 'b - 4ac'],
        correctIndex: 1,
        explanation: 'The discriminant is Δ = b² - 4ac.',
        difficulty: 'EASY',
        displayOrder: 3,
      },
      {
        quizId: mathsQuiz.id,
        text: 'If the discriminant is zero, the roots are:',
        options: ['Real and distinct', 'Real and equal', 'Imaginary', 'Undefined'],
        correctIndex: 1,
        explanation: 'When Δ = 0 the equation has two equal real roots.',
        difficulty: 'MEDIUM',
        displayOrder: 4,
      },
      {
        quizId: mathsQuiz.id,
        text: 'The sum of the roots of ax² + bx + c = 0 is:',
        options: ['-b/a', 'b/a', 'c/a', '-c/a'],
        correctIndex: 0,
        explanation: 'For roots α and β: α + β = -b/a and αβ = c/a.',
        difficulty: 'MEDIUM',
        displayOrder: 5,
      },
      {
        quizId: scienceQuiz.id,
        text: 'The value of acceleration due to gravity on the Earth’s surface is approximately:',
        options: ['9.8 m/s²', '8.9 m/s²', '10.8 m/s²', '6.67 m/s²'],
        correctIndex: 0,
        explanation: 'g ≈ 9.8 m/s² at the Earth’s surface.',
        difficulty: 'EASY',
        displayOrder: 1,
      },
      {
        quizId: scienceQuiz.id,
        text: 'The universal gravitational constant G has the value:',
        options: [
          '6.67 × 10⁻¹¹ N m²/kg²',
          '9.8 × 10⁻¹¹ N m²/kg²',
          '6.67 × 10⁻¹⁰ N m²/kg²',
          '3.00 × 10⁸ N m²/kg²',
        ],
        correctIndex: 0,
        explanation: 'G = 6.674 × 10⁻¹¹ N m²/kg².',
        difficulty: 'MEDIUM',
        displayOrder: 2,
      },
      {
        quizId: scienceQuiz.id,
        text: 'Gravitational force between two bodies is inversely proportional to:',
        options: [
          'The distance between them',
          'The square of the distance between them',
          'The sum of their masses',
          'The cube of the distance between them',
        ],
        correctIndex: 1,
        explanation: 'F = G·m₁m₂/r² — an inverse-square law.',
        difficulty: 'MEDIUM',
        displayOrder: 3,
      },
      {
        quizId: physicsQuiz.id,
        text: 'The moment of inertia of a body depends on:',
        options: [
          'Only its mass',
          'Only its angular velocity',
          'Its mass and the distribution of that mass about the axis',
          'Only the applied torque',
        ],
        correctIndex: 2,
        explanation: 'I = Σmr², so both mass and its distance from the axis matter.',
        difficulty: 'MEDIUM',
        displayOrder: 1,
      },
    ],
  });

  // --- Users ---------------------------------------------------------------
  const [adminHash, studentHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, 12),
    bcrypt.hash(STUDENT_PASSWORD, 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: 'BackTrack Admin',
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash: adminHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Demo Student',
      email: STUDENT_EMAIL.toLowerCase(),
      passwordHash: studentHash,
      role: 'STUDENT',
      emailVerified: new Date(),
      boardId: ssc.id,
      classId: class10.id,
      // streamId intentionally null: SSC has no streams.
      currentStreak: 4,
      longestStreak: 9,
      lastActiveOn: new Date(),
    },
  });

  // --- Realistic student activity -----------------------------------------
  const publishedNotes = await prisma.note.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true },
    take: 5,
  });

  await prisma.noteProgress.createMany({
    data: publishedNotes.map((note, index) => ({
      userId: student.id,
      noteId: note.id,
      status: index < 3 ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: index < 3 ? new Date() : null,
    })),
  });

  if (publishedNotes[0]) {
    await prisma.bookmark.create({
      data: { userId: student.id, noteId: publishedNotes[0].id },
    });
  }

  const mathsQuestions = await prisma.quizQuestion.findMany({
    where: { quizId: mathsQuiz.id },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, correctIndex: true },
  });

  // Answer the first four correctly and the last one wrong -> score 4/5.
  const answers: Record<string, number> = {};
  mathsQuestions.forEach((q, i) => {
    answers[q.id] = i < 4 ? q.correctIndex : (q.correctIndex + 1) % 4;
  });

  await prisma.quizAttempt.create({
    data: {
      userId: student.id,
      quizId: mathsQuiz.id,
      score: 4,
      totalQuestions: mathsQuestions.length,
      answers,
      timeTakenSec: 328,
      completedAt: new Date(),
    },
  });

  // --- Summary -------------------------------------------------------------
  const counts = {
    boards: await prisma.board.count(),
    classes: await prisma.class.count(),
    streams: await prisma.stream.count(),
    subjects: await prisma.subject.count(),
    chapters: await prisma.chapter.count(),
    notes: await prisma.note.count(),
    pyqs: await prisma.pyq.count(),
    quizzes: await prisma.quiz.count(),
    questions: await prisma.quizQuestion.count(),
    users: await prisma.user.count(),
  };

  console.table(counts);
  console.log('\nAccounts created:');
  console.log(`  ADMIN    ${admin.email} / ${ADMIN_PASSWORD}`);
  console.log(`  STUDENT  ${student.email} / ${STUDENT_PASSWORD}`);
  console.log('\nSeed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
