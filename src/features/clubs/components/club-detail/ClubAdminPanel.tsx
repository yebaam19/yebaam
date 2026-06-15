'use client';

import { useState } from 'react';
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

/** Per-member save status so concurrent role changes don't clobber each other. */
interface MemberState {
  pending?: boolean;
  error?: string;
  success?: string;
}

export function ClubAdminPanel({ clubId, ownerId, members }: ClubAdminPanelProps) {
  const router = useRouter();
  // Keyed by userId: each row owns its own pending/error/success so a save on
  // one member never re-enables or overwrites the message of another.
  const [states, setStates] = useState<Record<string, MemberState>>({});

  // The owner manages everyone else's role; the owner row is never editable.
  const manageable = members.filter((m) => m.userId !== ownerId);

  const handleRoleChange = async (member: ClubMemberLite, role: AssignableRole) => {
    setStates((prev) => ({ ...prev, [member.userId]: { pending: true } }));
    const result = await assignClubRoleAction(clubId, member.userId, role);
    if (!result.ok) {
      setStates((prev) => ({ ...prev, [member.userId]: { error: result.error } }));
      return;
    }
    setStates((prev) => ({
      ...prev,
      [member.userId]: {
        success: `Ahora es ${role === 'ADMIN' ? 'Administrador' : 'Miembro'}.`,
      },
    }));
    router.refresh();
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
            const state = states[m.userId];
            return (
              <li
                key={m.userId}
                className="rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center justify-between gap-3">
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
                        <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-300">
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
                    disabled={state?.pending}
                    onChange={(e) => void handleRoleChange(m, e.target.value as AssignableRole)}
                    className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    aria-label="Rol del miembro"
                  >
                    <option value="MEMBER">Miembro</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                {state?.success && (
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    {state.success}
                  </p>
                )}
                {state?.error && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{state.error}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
