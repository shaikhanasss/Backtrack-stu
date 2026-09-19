import type { Metadata } from 'next';

import { getAdminUsers } from '@/server/queries';
import { PageHeading } from '@/components/brand/page-heading';
import { EmptyState } from '@/components/brand/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Users' };

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-8">
      <PageHeading
        title="Users"
        description={`${users.length} registered ${users.length === 1 ? 'account' : 'accounts'}, newest first.`}
      />

      {users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users yet"
          description="Accounts appear here as students register."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Board / Class</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead className="text-right">Activity</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.map((user) => {
                  const initials = user.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('');

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                            <AvatarFallback>{initials || 'S'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-medium text-white">
                              <span className="truncate">{user.name}</span>
                              {!user.isActive ? (
                                <Badge variant="destructive">Inactive</Badge>
                              ) : null}
                            </div>
                            <div className="truncate text-xs text-white/55">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'muted'}>
                          {user.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm">
                        {user.board ? (
                          <>
                            {user.board.name}
                            {user.class ? ` · ${user.class.name}` : ''}
                          </>
                        ) : (
                          <span className="text-white/40">Not set</span>
                        )}
                      </TableCell>

                      {/* Stream is optional: SSC students legitimately have none. */}
                      <TableCell className="text-sm">
                        {user.stream?.name ?? (
                          <span className="text-white/40">
                            {user.board?.name === 'SSC' ? 'N/A' : '—'}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right text-sm tabular-nums">
                        {user._count.quizAttempts} quiz · {user._count.noteProgress} notes
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-white/70">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-white/50">
        This list is read-only for now. Role changes and deactivation are part of
        the next phase.
      </p>
    </div>
  );
}
