/**
 * Quiz scoring, kept pure so it can be tested without a database or a session.
 * `submitQuizAttempt` is the only caller; it supplies rows read server-side.
 */
export interface ScorableQuestion {
  id: string;
  correctIndex: number;
  marks: number;
}

export interface ScoreResult {
  score: number;
  totalMarks: number;
  correct: number;
  wrong: number;
  skipped: number;
  /** Answers with any unknown question id removed. */
  cleanedAnswers: Record<string, number>;
}

export function scoreAnswers(
  questions: ScorableQuestion[],
  answers: Record<string, number>
): ScoreResult {
  const known = new Set(questions.map((q) => q.id));

  // Drop anything that is not a question on this quiz, so a crafted payload
  // cannot add marks by inventing ids.
  const cleanedAnswers: Record<string, number> = {};
  for (const [id, selected] of Object.entries(answers)) {
    if (known.has(id)) cleanedAnswers[id] = selected;
  }

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const question of questions) {
    const selected = cleanedAnswers[question.id];
    if (selected === undefined) skipped += 1;
    else if (selected === question.correctIndex) {
      score += question.marks;
      correct += 1;
    } else wrong += 1;
  }

  return {
    score,
    totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    correct,
    wrong,
    skipped,
    cleanedAnswers,
  };
}
