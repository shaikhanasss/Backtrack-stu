import type { Metadata } from 'next';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAcademicOptions } from '@/server/queries';
import { PageHeading } from '@/components/brand/page-heading';
import { StatCard } from '@/components/brand/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import { ProfileForm } from '@/app/dashboard/profile/profile-form';
import { PasswordForm } from '@/app/dashboard/profile/password-form';
import { AvatarForm } from '@/app/dashboard/profile/avatar-form';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await requireUser('/dashboard/profile');

  const [options, counts, hasPassword] = await Promise.all([
    getAcademicOptions(),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        _count: { select: { noteProgress: true, quizAttempts: true, bookmarks: true } },
      },
    }),
    prisma.user
      .findUnique({ where: { id: user.id }, select: { passwordHash: true } })
      .then((row) => Boolean(row?.passwordHash)),
  ]);

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="space-y-8">
      <PageHeading title="👤 Profile" description="Your account and study details." />

      {/* --- Summary ------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback>{initials || 'S'}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <CardTitle>{user.name}</CardTitle>
              <CardDescription className="truncate">{user.email}</CardDescription>
            </div>

            <Badge variant={user.role === 'ADMIN' ? 'default' : 'muted'}>{user.role}</Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <Field label="Board" value={user.board?.name ?? 'Not set'} />
          <Field label="Class" value={user.class?.name ?? 'Not set'} />
          {/* Stream is optional by design: SSC has none. */}
          <Field
            label="Stream"
            value={
              user.stream?.name ??
              (user.board && user.board.slug === 'ssc'
                ? 'Not applicable for SSC'
                : 'Not set')
            }
          />
          <Field label="Member since" value={formatDate(user.createdAt)} />
          <Field label="Last updated" value={formatDate(user.updatedAt)} />
          <Field
            label="Sign-in method"
            value={hasPassword ? 'Email and password' : 'Google'}
          />
        </CardContent>
      </Card>

      {/* --- Activity ------------------------------------------------------ */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={user.currentStreak} label="Current Streak" />
        <StatCard value={user.longestStreak} label="Longest Streak" />
        <StatCard value={counts?._count.quizAttempts ?? 0} label="Quiz Attempts" />
        <StatCard value={counts?._count.bookmarks ?? 0} label="Bookmarks" />
      </div>

      <Separator />

      {/* --- Profile picture ----------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
          <CardDescription>
            Shown in the header and on your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarForm currentImage={user.image} name={user.name} />
        </CardContent>
      </Card>

      {/* --- Edit ---------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>
            Set your board and class so your study material is filtered to your
            syllabus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            options={options}
            defaults={{
              name: user.name,
              image: user.image,
              boardId: user.boardId,
              classId: user.classId,
              streamId: user.streamId,
            }}
          />
        </CardContent>
      </Card>

      {/* Password change is meaningless for OAuth-only accounts. */}
      {hasPassword ? (
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Your current password is required, so a hijacked session cannot
              lock you out of your own account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="mt-1 text-white">{value}</dd>
    </div>
  );
}
