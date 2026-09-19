'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { LogOut, LayoutDashboard, Loader2, User as UserIcon, Shield } from 'lucide-react';
import type { Role } from '@prisma/client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logoutUser } from '@/server/actions/auth-actions';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function UserMenu({
  name,
  email,
  role,
  image,
}: {
  name: string;
  email: string;
  role: Role;
  image?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
        <Avatar>
          {image ? <AvatarImage src={image} alt="" /> : null}
          <AvatarFallback>{initials(name) || 'S'}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-semibold normal-case text-white">{name}</div>
          <div className="truncate text-xs font-normal normal-case text-white/60">
            {email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <UserIcon /> Profile
          </Link>
        </DropdownMenuItem>

        {role === 'ADMIN' ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield /> Admin Panel
            </Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        {/* Logout is a Server Action: it clears the session cookie server-side,
            so there is no client-held boolean to fall out of sync. */}
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(async () => {
              await logoutUser();
            });
          }}
          className="text-destructive focus:text-destructive"
        >
          {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
          {isPending ? 'Signing out...' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
