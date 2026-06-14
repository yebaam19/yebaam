'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { ClubMemberLite } from '@/features/clubs/server/clubs.server';
import { assignClubRoleAction } from '@/features/clubs/server/clubs.actions';
import {
  CheckBadgeIcon,
  UserCircleIcon,
} from '@/components/icons/heroicons-shim';

interface ClubAdminPanelProps {
  clubId: string;
  ownerId: string;
  members: ClubMemberLite[];
}

type AssignableRole = 'ADMIN' | 'MEMBER';

export function ClubAdminPanel({ clubId, ownerId, members }: ClubAdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingFor, setSavingFor] = useState<string | null>(null);

  // The owner manages everyone else's role; the owner row is never editable.
  const manageable = members.filter((m) => m.userId !== ownerId);

  const handleRoleChange = (member: ClubMemberLite, role: AssignableRole) => {
    setError(null);
    setSuccess(null);
    setSavingFor(member.userId);
    startTransition(async () => {
      const result = await assignClubRoleAction(clubId, member.userId, role);
      setSavingFor(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        `${member.displayName || member.username || 'El miembro'} ahora es ${
          role === 'ADMIN' ? 'Administrador' : 'Miembro'
        }.`,
      );
      router.refresh();
    });
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <CheckBadgeIcon className="h-5 w-5 text-primary-500" />
        Administradores del club
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Como propietario, puedes nombrar administradores que ayuden a gestionar el club.
      </p>

      {manageable.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aún no hay otros miembros a quienes asignar roles.
        </p>
      ) : (
        <ul className="space-y-2">
          {manageable.map((m) => {
            const role: AssignableRole = m.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
            return (
              <li
                key={m.userId}
                className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    {m.avatarUrl ? (
                      <Image
                        src={m.avatarUrl}
                        alt={m.displayName ?? 'user'}
                        fill
                        sizes="36px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <UserCircleIcon className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {m.displayName || m.username || 'Sin nombre'}
                    </p>
                    {m.username && (
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        @{m.username}
                      </p>
                    )}
                  </div>
                </div>
                <select
                  value={role}
                  disabled={isPending && savingFor === m.userId}
                  onChange={(e) => handleRoleChange(m, e.target.value as AssignableRole)}
                  className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  aria-label="Rol del miembro"
                >
                  <option value="MEMBER">Miembro</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </li>
            );
          })}
        </ul>
      )}

      {success && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {success}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
