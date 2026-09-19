import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen, Bookmark, Clock, FileText, Flame, Gamepad2, Target, TrendingUp,
} from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { getDashboardData } from '@/server/student-queries';
import { StatCard } from '@/components/brand/stat-card';
import { EmptyState } from '@/components/brand/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, percentage } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Student dashboard.
 *
 * Every number below is computed from this student's own rows. The prototype's
 * hardcoded "45 notes / 18-20 / 🔥7" have no counterpart anywhere in this file.
 */
export default async function DashboardPage() {
  const sessionUser = await requireUser('/dashboard');
  const data = await getDashboardData(sessionUser.id);

  const name = data.user?.name ?? 'Student';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

  const profileLine = data.user?.board
    ? [data.user.board.name, data.user.class?.name, data.user.stream?.name]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <div className="space-y-8">
      {/* --- Welcome + profile summary ------------------------------------ */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <Avatar className="size-16">
            {data.user?.image ? <AvatarImage src={data.user.image} alt="" /> : null}
            <AvatarFallback>{initials || 'S'}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white">👋 Welcome back, {name}</h1>
            <p className="mt-1 text-sm text-white/65">
              {profileLine ?? 'Set your board and class in Profile to personalise your feed.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/profile">Edit profile</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/notes">Browse material</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Headline stats ------------------------------------------------ */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={data.completedNotes} label="Notes Completed" />
        <StatCard
          value={data.attemptCount > 0 ? `${data.averageScore}%` : '—'}
          label="Average Quiz Score"
        />
        <StatCard value={`🔥 ${data.user?.currentStreak ?? 0}`} label="Current Streak" />
        <StatCard value={data.bookmarkCount} label="Bookmarks" />
      </section>

      {/* --- Overall progress --------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp size={18} className="text-brand-gold" /> Overall progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-white/65">
              {data.completedNotes} of {data.publishedNotes} published notes completed
            </span>
            <span className="font-semibold text-white">{data.completionPercent}%</span>
          </div>
          <Progress value={data.completionPercent} />
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <Mini icon={<BookOpen size={14} />} label="Notes viewed" value={data.viewedNotes} />
            <Mini icon={<Gamepad2 size={14} />} label="Quizzes attempted" value={data.attemptCount} />
            <Mini icon={<Target size={14} />} label="Best score" value={data.attemptCount ? `${data.bestScore}%` : '—'} />
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/progress">See detailed progress →</Link>
          </Button>
        </CardContent>
      </Card>

      {/* --- Continue learning -------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/55">
          <Clock size={14} /> Continue learning
        </h2>

        {data.continueLearning.length === 0 ? (
          <EmptyState
            icon="🚀"
            title="Nothing in progress"
            description="Open any study material and it will appear here so you can pick up where you left off."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {data.continueLearning.map((item) => (
              <Link key={item.note.id} href={`/dashboard/material/${item.note.id}`}>
                <Card className="card-hover h-full">
                  <CardContent className="p-5">
                    <div className="text-2xl" aria-hidden="true">
                      {item.note.chapter.subject.icon ?? '📄'}
                    </div>
                    <p className="mt-2 font-semibold text-white">{item.note.title}</p>
                    <p className="mt-1 text-xs text-white/55">
                      {item.note.chapter.subject.name} · Ch {item.note.chapter.number}
                    </p>
                    <p className="mt-3 text-xs text-white/40">
                      Last opened {formatDate(item.lastReadAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* --- Recently viewed ---------------------------------------------- */}
      {data.recentlyViewed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            Recently viewed
          </h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-white/10">
                {data.recentlyViewed.map((item) => (
                  <li key={item.note.id}>
                    <Link
                      href={`/dashboard/material/${item.note.id}`}
                      className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-white/5"
                    >
                      <span aria-hidden="true">{item.note.chapter.subject.icon ?? '📄'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{item.note.title}</p>
                        <p className="truncate text-xs text-white/50">
                          {item.note.chapter.subject.name} · Ch {item.note.chapter.number}:{' '}
                          {item.note.chapter.title}
                        </p>
                      </div>
                      {item.status === 'COMPLETED' ? (
                        <Badge>Completed</Badge>
                      ) : (
                        <Badge variant="muted">In progress</Badge>
                      )}
                      <span className="whitespace-nowrap text-xs text-white/40">
                        {formatDate(item.lastReadAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* --- Quiz performance --------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/55">
          <Gamepad2 size={14} /> Quiz performance
        </h2>

        {data.attempts.length === 0 ? (
          <EmptyState
            icon="🎮"
            title="No quizzes attempted yet"
            description="Take a quiz and your scores will be tracked here."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-white/10">
                {data.attempts.slice(0, 5).map((attempt) => {
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

      {/* --- Available subjects ------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            Available subjects
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/notes">Browse all →</Link>
          </Button>
        </div>

        {data.subjects.length === 0 ? (
          <EmptyState
            icon="📖"
            title="No subjects published yet"
            description="Subjects appear here once an admin publishes them."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.subjects.map((subject) => (
              <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`}>
                <Card className="card-hover h-full">
                  <CardContent className="p-5">
                    <div className="text-2xl" aria-hidden="true">{subject.icon ?? '📖'}</div>
                    <p className="mt-2 font-semibold text-white">{subject.name}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {subject.class.board.name} · {subject.class.name}
                      {subject.stream ? ` · ${subject.stream.name}` : ''}
                    </p>
                    <p className="mt-2 text-xs text-white/40">
                      {subject._count.chapters} chapters
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* --- Recent activity ---------------------------------------------- */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bookmark size={16} className="text-brand-gold" /> Recent bookmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentBookmarks.length === 0 ? (
              <p className="text-sm text-white/55">
                Nothing bookmarked yet. Use the bookmark button on any note or paper.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.recentBookmarks.map((bookmark) => (
                  <li key={bookmark.id} className="flex items-center gap-2 text-sm">
                    {bookmark.note ? (
                      <>
                        <BookOpen size={14} className="shrink-0 text-white/45" />
                        <Link
                          href={`/dashboard/material/${bookmark.note.id}`}
                          className="truncate text-white/85 hover:text-brand-gold"
                        >
                          {bookmark.note.title}
                        </Link>
                      </>
                    ) : bookmark.pyq ? (
                      <>
                        <FileText size={14} className="shrink-0 text-white/45" />
                        <Link href="/dashboard/pyqs" className="truncate text-white/85 hover:text-brand-gold">
                          {bookmark.pyq.title}
                        </Link>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-3">
              <Link href="/dashboard/bookmarks">All bookmarks →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame size={16} className="text-brand-gold" /> Study streak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/70">
            <p>
              Current streak:{' '}
              <span className="font-bold text-white">
                {data.user?.currentStreak ?? 0} day
                {data.user?.currentStreak === 1 ? '' : 's'}
              </span>
            </p>
            <p>
              Longest streak:{' '}
              <span className="font-bold text-white">{data.user?.longestStreak ?? 0}</span>
            </p>
            <p className="text-xs text-white/45">
              {data.user?.lastActiveOn
                ? `Last studied ${formatDate(data.user.lastActiveOn)}.`
                : 'Open a note or take a quiz to start your streak.'}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
      <span className="text-white/45">{icon}</span>
      <span className="text-white/60">{label}</span>
      <span className="ml-auto font-semibold text-white">{value}</span>
    </div>
  );
}
