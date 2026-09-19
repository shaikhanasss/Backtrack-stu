/**
 * Streak arithmetic, separated from the database write so the day-boundary
 * rules can be tested directly.
 */
export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysBetween(a: Date, b: Date) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY);
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveOn: Date | null;
}

/**
 * Returns the streak after activity at `now`, or null when nothing changes.
 *
 *   same day     -> null (opening ten notes is still one day of study)
 *   next day     -> +1
 *   longer gap   -> reset to 1
 *   never active -> start at 1
 *   clock skew   -> null, never punish the student for a bad clock
 */
export function nextStreak(state: StreakState, now: Date) {
  if (state.lastActiveOn) {
    const gap = daysBetween(state.lastActiveOn, now);
    if (gap <= 0) return null;
    const currentStreak = gap === 1 ? state.currentStreak + 1 : 1;
    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, state.longestStreak),
      lastActiveOn: now,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: Math.max(1, state.longestStreak),
    lastActiveOn: now,
  };
}
