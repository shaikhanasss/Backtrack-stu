import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { scoreAnswers } from '../src/lib/quiz-scoring';
import { nextStreak, daysBetween } from '../src/lib/streak-math';
import { percentage, slugify } from '../src/lib/utils';
import { loginSchema, signupSchema } from '../src/lib/validators/auth';
import { profileSchema, changePasswordSchema } from '../src/lib/validators/profile';
import { subjectSchema, quizQuestionSchema, chapterSchema } from '../src/lib/validators/admin';

const Q = [
  { id: 'q1', correctIndex: 1, marks: 1 },
  { id: 'q2', correctIndex: 0, marks: 2 },
  { id: 'q3', correctIndex: 3, marks: 1 },
];

describe('quiz scoring', () => {
  test('all correct scores full marks', () => {
    const r = scoreAnswers(Q, { q1: 1, q2: 0, q3: 3 });
    assert.equal(r.score, 4);
    assert.equal(r.totalMarks, 4);
    assert.equal(r.correct, 3);
  });

  test('weights marks per question', () => {
    const r = scoreAnswers(Q, { q2: 0 });
    assert.equal(r.score, 2, 'the 2-mark question is worth 2');
    assert.equal(r.skipped, 2);
  });

  test('wrong answers score zero, never negative', () => {
    const r = scoreAnswers(Q, { q1: 0, q2: 3, q3: 0 });
    assert.equal(r.score, 0);
    assert.equal(r.wrong, 3);
  });

  test('unanswered questions count as skipped', () => {
    const r = scoreAnswers(Q, {});
    assert.equal(r.score, 0);
    assert.equal(r.skipped, 3);
  });

  test('invented question ids cannot add marks', () => {
    const r = scoreAnswers(Q, { q1: 1, 'not-a-question': 0 });
    assert.equal(r.score, 1);
    assert.deepEqual(Object.keys(r.cleanedAnswers), ['q1']);
  });

  test('an empty quiz scores zero rather than dividing by zero', () => {
    const r = scoreAnswers([], { q1: 1 });
    assert.equal(r.score, 0);
    assert.equal(r.totalMarks, 0);
  });
});

describe('streak calculation', () => {
  const day = (iso: string) => new Date(`${iso}T12:00:00`);

  test('first ever activity starts the streak at 1', () => {
    const r = nextStreak({ currentStreak: 0, longestStreak: 0, lastActiveOn: null }, day('2026-01-10'));
    assert.equal(r?.currentStreak, 1);
  });

  test('second visit on the same day does not change anything', () => {
    const r = nextStreak(
      { currentStreak: 3, longestStreak: 5, lastActiveOn: new Date('2026-01-10T08:00:00') },
      new Date('2026-01-10T22:00:00')
    );
    assert.equal(r, null);
  });

  test('consecutive day increments', () => {
    const r = nextStreak({ currentStreak: 3, longestStreak: 5, lastActiveOn: day('2026-01-10') }, day('2026-01-11'));
    assert.equal(r?.currentStreak, 4);
  });

  test('a missed day resets to 1', () => {
    const r = nextStreak({ currentStreak: 9, longestStreak: 9, lastActiveOn: day('2026-01-10') }, day('2026-01-13'));
    assert.equal(r?.currentStreak, 1);
  });

  test('longest streak is preserved through a reset', () => {
    const r = nextStreak({ currentStreak: 9, longestStreak: 9, lastActiveOn: day('2026-01-10') }, day('2026-01-20'));
    assert.equal(r?.longestStreak, 9);
  });

  test('a new record raises the longest streak', () => {
    const r = nextStreak({ currentStreak: 9, longestStreak: 9, lastActiveOn: day('2026-01-10') }, day('2026-01-11'));
    assert.equal(r?.longestStreak, 10);
  });

  test('a backwards clock never punishes the student', () => {
    const r = nextStreak({ currentStreak: 4, longestStreak: 4, lastActiveOn: day('2026-01-10') }, day('2026-01-08'));
    assert.equal(r, null);
  });

  test('day boundaries ignore the time of day', () => {
    assert.equal(daysBetween(new Date('2026-01-10T23:59:00'), new Date('2026-01-11T00:01:00')), 1);
  });
});

describe('progress calculation', () => {
  test('computes a percentage', () => assert.equal(percentage(3, 4), 75));
  test('rounds to the nearest whole percent', () => assert.equal(percentage(1, 3), 33));
  test('never divides by zero', () => assert.equal(percentage(0, 0), 0));
  test('handles nothing completed', () => assert.equal(percentage(0, 17), 0));
});

describe('slugify', () => {
  test('lowercases and hyphenates', () =>
    assert.equal(slugify('Linear Equations in Two Variables'), 'linear-equations-in-two-variables'));
  test('strips punctuation', () => assert.equal(slugify('Book-Keeping & Accountancy'), 'book-keeping-accountancy'));
});

describe('authentication validation', () => {
  test('rejects a malformed email', () => {
    assert.equal(loginSchema.safeParse({ email: 'nope', password: 'x' }).success, false);
  });

  test('rejects a weak password on signup', () => {
    const r = signupSchema.safeParse({ name: 'A B', email: 'a@b.com', password: 'weak', confirmPassword: 'weak' });
    assert.equal(r.success, false);
  });

  test('rejects mismatched passwords', () => {
    const r = signupSchema.safeParse({ name: 'A B', email: 'a@b.com', password: 'Str0ngPass', confirmPassword: 'Different1' });
    assert.equal(r.success, false);
    assert.equal(r.error?.issues[0]?.path[0], 'confirmPassword');
  });

  test('accepts a valid signup', () => {
    assert.equal(
      signupSchema.safeParse({ name: 'Aditya C', email: 'a@b.com', password: 'Str0ngPass', confirmPassword: 'Str0ngPass' }).success,
      true
    );
  });

  test('a new password must differ from the current one', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'Str0ngPass', newPassword: 'Str0ngPass', confirmPassword: 'Str0ngPass' });
    assert.equal(r.success, false);
  });
});

describe('student profile validation', () => {
  test('a class without a board is rejected', () => {
    const r = profileSchema.safeParse({ name: 'A B', image: '', boardId: null, classId: 'c1', streamId: null });
    assert.equal(r.success, false);
  });

  test('a stream without a board is rejected', () => {
    const r = profileSchema.safeParse({ name: 'A B', image: '', boardId: null, classId: null, streamId: 's1' });
    assert.equal(r.success, false);
  });

  test('a stream-less profile is valid (this is the SSC case)', () => {
    const r = profileSchema.safeParse({ name: 'A B', image: '', boardId: 'b1', classId: 'c1', streamId: null });
    assert.equal(r.success, true);
  });

  test('an empty image clears to null rather than failing', () => {
    const r = profileSchema.safeParse({ name: 'A B', image: '', boardId: null, classId: null, streamId: null });
    assert.equal(r.success && r.data.image, null);
  });
});

describe('admin content validation', () => {
  test('a subject may have no stream', () => {
    const r = subjectSchema.safeParse({ classId: 'c1', streamId: null, name: 'English', slug: 'english', code: '', description: '', icon: '', displayOrder: 1, isActive: true });
    assert.equal(r.success, true);
    assert.equal(r.success && r.data.streamId, null);
  });

  test('slugs must be url-safe', () => {
    const r = subjectSchema.safeParse({ classId: 'c1', streamId: null, name: 'English', slug: 'Not A Slug!', code: '', description: '', icon: '', displayOrder: 0, isActive: true });
    assert.equal(r.success, false);
  });

  test('subject codes are upper-cased', () => {
    const r = subjectSchema.safeParse({ classId: 'c1', streamId: null, name: 'Maths', slug: 'maths', code: 'math10', description: '', icon: '', displayOrder: 0, isActive: true });
    assert.equal(r.success && r.data.code, 'MATH10');
  });

  test('a question needs exactly four options', () => {
    const base = { quizId: 'q', text: 'What is 2 + 2?', correctIndex: 1, explanation: '', difficulty: 'EASY', marks: 1, displayOrder: 1 };
    assert.equal(quizQuestionSchema.safeParse({ ...base, options: ['3', '4', '5'] }).success, false);
    assert.equal(quizQuestionSchema.safeParse({ ...base, options: ['3', '4', '5', '6'] }).success, true);
  });

  test('duplicate options are rejected', () => {
    const r = quizQuestionSchema.safeParse({ quizId: 'q', text: 'Pick one', options: ['same', 'same', 'b', 'c'], correctIndex: 0, explanation: '', difficulty: 'EASY', marks: 1, displayOrder: 1 });
    assert.equal(r.success, false);
  });

  test('the correct answer must be one of the four', () => {
    const r = quizQuestionSchema.safeParse({ quizId: 'q', text: 'Pick one', options: ['a', 'b', 'c', 'd'], correctIndex: 7, explanation: '', difficulty: 'EASY', marks: 1, displayOrder: 1 });
    assert.equal(r.success, false);
  });

  test('chapter numbers start at 1', () => {
    const base = { subjectId: 's', title: 'Intro', slug: 'intro', description: '', displayOrder: 0, isActive: true };
    assert.equal(chapterSchema.safeParse({ ...base, number: 0 }).success, false);
    assert.equal(chapterSchema.safeParse({ ...base, number: 1 }).success, true);
  });
});
