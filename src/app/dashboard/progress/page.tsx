import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/auth';
import { getDashboardData, getProgressBreakdown } from '@/server/student-queries';
import { PageHeading } from '@/components/brand/page-heading';
import { StatCard } from '@/components/brand/stat-card';
import { EmptyState } from '@/components/brand/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate, percentage } from '@/lib/utils';

export const metadata: Metadata = { title: 'Progress' };

export default async function ProgressPage() {
  const user = await requireUser('/dashboard/progress');
  const [data, breakdown] = await Promise.all([
    getDashboardData(user.id),
    getProgressBreakdown(user.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeading
        title="📊 Your Progress"
        description="Every figure here is computed from your own activity."
      />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard value={data.completedNotes} label="Notes Completed" />
        <StatCard value={data.viewedNotes} label="Notes Viewed" />
        <StatCard value={data.attemptCount} label="Quizzes Attempted" />
        <StatCard
          value={data.attemptCount ? `${data.averageScore}%` : '—'}
          label="Average Score"
        />
        <StatCard value={data.attemptCount ? `${data.bestScore}%` : '—'} label="Best Score" />
        <StatCard value={`🔥 ${data.user?.currentStreak ?? 0}`} label="Current Streak" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-white/65">
              {data.completedNotes} of {data.publishedNotes} published notes
            </span>
            <span className="font-semibold text-white">{data.completionPercent}%</span>
          </div>
          <Progress value={data.completionPercent} />
          <p className="text-xs text-white/45">
            Longest streak {data.user?.longestStreak ?? 0} days
            {data.user?.lastActiveOn ? ` · last studied ${formatDate(data.user.lastActiveOn)}` : ''}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
          Subject-wise progress
        </h2>

        {breakdown.length === 0 ? (
          <EmptyState
            icon="📖"
            title="No published material yet"
            description="Once notes are published, your per-subject progress will appear here."
          />
        ) : (
          <div className="space-y-3">
            {breakdown.map((subject) => (
              <Card key={subject.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/dashboard/subjects/${subject.id}`}
                      className="flex min-w-0 items-center gap-2 font-semibold text-white hover:text-brand-gold"
                    >
                      <span aria-hidden="true">{subject.icon ?? '📖'}</span>
                      <span className="truncate">{subject.name}</span>
                    </Link>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/55">
                        {subject.completed}/{subject.total} completed
                      </span>
                      <Badge variant={subject.percent === 100 ? 'default' : 'muted'}>
                        {subject.percent}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={subject.percent} />
                  <p className="text-xs text-white/45">
                    {subject.context} · {subject.viewed} opened
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
          Quiz history
        </h2>

        {data.attempts.length === 0 ? (
          <EmptyState
            icon="🎮"
            title="No attempts yet"
            description="Your quiz scores will be listed here once you take one."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-white/10">
                {data.attempts.map((attempt) => {
                  const pct = percentage(attempt.score, attempt.totalQuestions);
                  return (
                    <li key={attempt.id}>
                      <Link
                        href={`/dashboard/quiz/result/${attempt.id}`}
                        className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-white/5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {attempt.quiz.title}
                          </p>
                          <p className="text-xs text-white/50">{attempt.quiz.subject.name}</p>
                        </div>
                        <span className="text-sm tabular-nums text-white/70">
                          {attempt.score}/{attempt.totalQuestions}
                        </span>
                        <Badge variant={pct >= 50 ? 'default' : 'muted'}>{pct}%</Badge>
                        <span className="whitespace-nowrap text-xs text-white/40">
                          {attempt.completedAt ? formatDate(attempt.completedAt) : ''}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
