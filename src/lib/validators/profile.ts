import { z } from 'zod';
import { passwordSchema } from '@/lib/validators/auth';

/**
 * Empty <Select> values arrive as '' from the DOM. Treat those as "not set"
 * so an optional academic field clears cleanly instead of failing validation.
 */
const optionalId = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .default(null);

export const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name must be at most 80 characters'),
    image: z
      .string()
      .trim()
      .url('Enter a valid image URL')
      .max(500, 'URL is too long')
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .default(null),
    boardId: optionalId,
    classId: optionalId,
    streamId: optionalId,
  })
  .superRefine((data, ctx) => {
    // A class without a board is meaningless — the class list is derived from it.
    if (data.classId && !data.boardId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['boardId'],
        message: 'Select a board before choosing a class',
      });
    }

    // A stream without a board is equally meaningless.
    if (data.streamId && !data.boardId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['boardId'],
        message: 'Select a board before choosing a stream',
      });
    }
  });

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileOutput = z.output<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
