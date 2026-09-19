import { z } from 'zod';

/** Shared field helpers ---------------------------------------------------- */

const id = z.string().min(1, 'Required');

const optionalId = z
  .string()
  .trim()
  .transform((value) => (value === '' || value === '__none__' ? null : value))
  .nullable()
  .default(null);

const name = (label: string, max = 120) =>
  z.string().trim().min(2, `${label} must be at least 2 characters`).max(max, `${label} is too long`);

const slug = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(120, 'Slug is too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .default(null);

const displayOrder = z.coerce
  .number()
  .int('Must be a whole number')
  .min(0, 'Cannot be negative')
  .max(9999, 'Too large')
  .default(0);

export const contentStatus = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

/** Board -------------------------------------------------------------------- */
export const boardSchema = z.object({
  name: name('Board name', 60),
  slug,
  description: optionalText(500),
  icon: optionalText(10),
  displayOrder,
  isActive: z.boolean().default(true),
});
export type BoardInput = z.input<typeof boardSchema>;

/** Class -------------------------------------------------------------------- */
export const classSchema = z.object({
  boardId: id,
  level: z.coerce
    .number()
    .int('Must be a whole number')
    .min(1, 'Level must be at least 1')
    .max(12, 'Level must be at most 12'),
  name: name('Class name', 60),
  slug,
  isActive: z.boolean().default(true),
});
export type ClassInput = z.input<typeof classSchema>;

/** Stream ------------------------------------------------------------------- */
export const streamSchema = z.object({
  boardId: id,
  name: name('Stream name', 60),
  slug,
  description: optionalText(500),
  icon: optionalText(10),
  isActive: z.boolean().default(true),
});
export type StreamInput = z.input<typeof streamSchema>;

/** Subject ------------------------------------------------------------------ */
export const subjectSchema = z.object({
  classId: id,
  // Null means "common to every stream" (and is the only option for SSC).
  streamId: optionalId,
  name: name('Subject name'),
  slug,
  code: z
    .string()
    .trim()
    .max(20, 'Code is too long')
    .regex(/^[A-Za-z0-9-]*$/, 'Use letters, numbers and hyphens only')
    .transform((value) => (value === '' ? null : value.toUpperCase()))
    .nullable()
    .default(null),
  description: optionalText(500),
  icon: optionalText(10),
  displayOrder,
  isActive: z.boolean().default(true),
});
export type SubjectInput = z.input<typeof subjectSchema>;

/** Chapter ------------------------------------------------------------------ */
export const chapterSchema = z.object({
  subjectId: id,
  number: z.coerce
    .number()
    .int('Must be a whole number')
    .min(1, 'Chapter number starts at 1')
    .max(999, 'Too large'),
  title: name('Chapter title', 200),
  slug,
  description: optionalText(1000),
  displayOrder,
  isActive: z.boolean().default(true),
});
export type ChapterInput = z.input<typeof chapterSchema>;

/** Note (study material) ---------------------------------------------------- */
export const noteSchema = z.object({
  chapterId: id,
  title: name('Title', 200),
  slug,
  summary: optionalText(500),
  content: optionalText(50_000),
  pdfFileId: optionalId,
  thumbnailFileId: optionalId,
  imageFileIds: z.array(z.string()).max(20, 'At most 20 images').default([]),
  isPremium: z.boolean().default(false),
  status: contentStatus.default('DRAFT'),
});
export type NoteInput = z.input<typeof noteSchema>;

/** PYQ ---------------------------------------------------------------------- */
const currentYear = new Date().getFullYear();
export const pyqSchema = z.object({
  subjectId: id,
  chapterId: optionalId,
  title: name('Title', 200),
  year: z.coerce
    .number()
    .int('Must be a whole number')
    .min(1990, 'Year looks too early')
    .max(currentYear + 1, 'Year cannot be in the future'),
  examSession: optionalText(120),
  description: optionalText(1000),
  questionFileId: optionalId,
  solutionFileId: optionalId,
  status: contentStatus.default('DRAFT'),
});
export type PyqInput = z.input<typeof pyqSchema>;

/** Quiz --------------------------------------------------------------------- */
export const quizSchema = z.object({
  subjectId: id,
  chapterId: optionalId,
  title: name('Title', 200),
  slug,
  description: optionalText(1000),
  durationMin: z.coerce
    .number()
    .int('Must be a whole number')
    .min(1, 'At least 1 minute')
    .max(300, 'At most 300 minutes'),
  passingScore: z.coerce
    .number()
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100'),
  status: contentStatus.default('DRAFT'),
});
export type QuizInput = z.input<typeof quizSchema>;

/** Quiz question ------------------------------------------------------------ */
export const quizQuestionSchema = z
  .object({
    quizId: id,
    text: z.string().trim().min(5, 'Question must be at least 5 characters').max(2000, 'Too long'),
    options: z
      .array(z.string().trim().min(1, 'Every option needs text').max(500, 'Option is too long'))
      .length(4, 'Provide exactly 4 options'),
    correctIndex: z.coerce
      .number()
      .int()
      .min(0, 'Select the correct answer')
      .max(3, 'Select the correct answer'),
    explanation: optionalText(2000),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    marks: z.coerce.number().int('Must be a whole number').min(1, 'At least 1 mark').max(100, 'Too many marks'),
    displayOrder,
  })
  .superRefine((data, ctx) => {
    // Duplicate options make a question unanswerable in practice.
    const seen = new Set<string>();
    data.options.forEach((option, index) => {
      const key = option.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', index],
          message: 'Options must be distinct',
        });
      }
      seen.add(key);
    });
  });
export type QuizQuestionInput = z.input<typeof quizQuestionSchema>;
