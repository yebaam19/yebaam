'use client';

import { FC, useMemo } from 'react';
import { UsersIcon } from '@/components/icons/heroicons-shim';
import { getUserDisplayName } from '@/lib/user-helpers';
import { usePageTeam } from '../../hooks/usePages';
import type { Page } from '../../types/page.types';
import { TeamMemberCard, type TeamMemberCardProps } from './team/TeamMemberCard';
import { normalizePageRole, rolePriority } from './team/roles';

interface PageDetailTeamProps {
  page: Page;
}

/**
 * Pestaña "Equipo de Trabajo" (PDF §4). `GET /api/pages/[idOrSlug]/team` sólo
 * devuelve las filas de `page_team_members`, que NO incluyen al propietario —
 * éste vive en `pages.owner_id`. Por eso lo anteponemos aquí a mano y
 * deduplicamos por `userId`, por si alguna vez se le asigna además una fila de
 * equipo (`/team/assign` no lo impide).
 */
export const PageDetailTeam: FC<PageDetailTeamProps> = ({ page }) => {
  const { data, isLoading, error } = usePageTeam(page.id);

  const members = useMemo<Array<TeamMemberCardProps & { key: string }>>(() => {
    const owner: TeamMemberCardProps & { key: string } = {
      key: page.ownerId,
      displayName: getUserDisplayName({
        displayName: page.ownerName,
        username: page.ownerUsername,
      }),
      username: page.ownerUsername,
      avatarUrl: page.ownerAvatar,
      presentation: page.ownerBio,
      role: 'OWNER',
    };

    const team = (data ?? [])
      .filter((m) => m.userId !== page.ownerId)
      .map((m) => ({
        key: m.userId,
        displayName: getUserDisplayName({
          firstName: m.firstName,
          lastName: m.lastName,
          username: m.username,
        }),
        username: m.username || undefined,
        avatarUrl: m.avatarUrl,
        presentation: m.bio,
        role: normalizePageRole(m.role),
      }))
      .sort(
        (a, b) =>
          rolePriority(a.role) - rolePriority(b.role) ||
          a.displayName.localeCompare(b.displayName, 'es')
      );

    return [owner, ...team];
  }, [data, page.ownerId, page.ownerName, page.ownerUsername, page.ownerAvatar]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm animate-pulse"
          >
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No pudimos cargar el equipo de trabajo. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UsersIcon className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Equipo de Trabajo
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({members.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(({ key, ...member }) => (
          <TeamMemberCard key={key} {...member} />
        ))}
      </div>

      {members.length === 1 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Todavía no hay más integrantes en el equipo de esta página.
        </p>
      )}
    </div>
  );
};
