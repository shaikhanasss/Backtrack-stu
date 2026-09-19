import 'server-only';

import { prisma } from '@/lib/prisma';
import { nextStreak } from '@/lib/streak-math';

/**
 * Records study activity for today and updates the streak.
 *
 * Called whenever a student opens a note or finishes a quiz — the two things
 * that actually constitute studying. The prototype displayed a hardcoded
 * "🔥 7"; this is where that number now comes from. The day-boundary rules
 * live in `streak-math.ts` so they can be tested without a database.
 */
export async function touchStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveOn: true },
  });
  if (!user) return null;

  const next = nextStreak(user, new Date());
  if (!next) return user;

  return prisma.user.update({
    where: { id: userId },
    data: next,
    select: { currentStreak: true, longestStreak: true, lastActiveOn: true },
  });
}
