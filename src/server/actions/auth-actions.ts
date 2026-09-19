'use server';

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { signIn, signOut } from '@/lib/auth';
import { loginSchema, signupSchema } from '@/lib/validators/auth';

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/**
 * Creates a real user row. The prototype's signup only fired an alert() and
 * navigated away without persisting anything.
 */
export async function registerUser(input: unknown): Promise<ActionResult> {
  // Re-validate on the server; never trust the client's word.
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const normalisedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalisedEmail },
    select: { id: true },
  });

  if (existing) {
    return {
      ok: false,
      message: 'An account with this email already exists.',
      fieldErrors: { email: ['This email is already registered'] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalisedEmail,
      passwordHash,
      role: 'STUDENT',
    },
  });

  return { ok: true };
}

/**
 * Verifies credentials through Auth.js. Returns a generic message on failure so
 * the response cannot be used to discover which emails are registered.
 */
export async function loginUser(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: 'Invalid email or password.' };
    }
    throw error;
  }
}

/**
 * Signs the user out and returns them to the landing page.
 *
 * Clearing the session server-side is what makes logout real: the prototype
 * only flipped a boolean in React state, which any refresh would have reset.
 */
export async function logoutUser() {
  await signOut({ redirect: false });
  redirect('/');
}
