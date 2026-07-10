'use client';

import { FC, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getUserDisplayName } from '@/lib/user-helpers';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { Page, PageRole } from '../../types/page.types';
import { usePageTeam, useAssignRole, useRemoveRole } from '../../hooks/usePages';
import { normalizePageRole, rolePriority } from '../detail/team/roles';
import { TeamMemberRow } from './roles/TeamMemberRow';
import { AddMemberPanel } from './roles/AddMemberPanel';
import { PermissionsReference } from './roles/PermissionsReference';

interface SettingsRolesProps {
  page: Page;
}

interface Row {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  role: PageRole;
  joinedAt?: string;
  isOwner: boolean;
}

export const SettingsRoles: FC<SettingsRolesProps> = ({ page }) => {
  const t = useTranslations('pages.settings.roles');
  const currentUser = useAuthStore((state) => state.user);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // No hace falta refetch manual: useAssignRole/useRemoveRole invalidan
  // `pages::team::<id>`, que es exactamente la clave de usePageTeam, y desde el
  // arreglo de `cacheStore` un invalidate despierta al hook ya montado
  // (stale-while-revalidate). Un `refetch()` extra aquí duplicaría la petición.
  const { data: team, isLoading } = usePageTeam(page.id);
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  // Compara ids, no cadenas de rol: `mapPage` devuelve `userRole` en minúsculas
  // ('owner'), así que el viejo `page.userRole === 'OWNER'` nunca era cierto y
  // los controles quedaban muertos. El servidor vuelve a exigir propiedad.
  const canManage = Boolean(currentUser?.id && currentUser.id === page.ownerId);
  const busy = assignRole.isPending || removeRole.isPending;

  const rows = useMemo<Row[]>(() => {
    const owner: Row = {
      userId: page.ownerId,
      displayName: getUserDisplayName({
        displayName: page.ownerName,
        username: page.ownerUsername,
      }),
      username: page.ownerUsername ?? '',
      avatarUrl: page.ownerAvatar,
      role: 'OWNER',
      isOwner: true,
    };

    // `GET /team` no incluye al propietario (vive en pages.owner_id).
    const members = (team ?? [])
      .filter((m) => m.userId !== page.ownerId)
      .map<Row>((m) => ({
        userId: m.userId,
        displayName: getUserDisplayName({
          firstName: m.firstName,
          lastName: m.lastName,
          username: m.username,
        }),
        username: m.username ?? '',
        avatarUrl: m.avatarUrl,
        role: normalizePageRole(m.role),
        joinedAt: m.joinedAt,
        isOwner: false,
      }))
      .sort(
        (a, b) =>
          rolePriority(a.role) - rolePriority(b.role) ||
          a.displayName.localeCompare(b.displayName, 'es')
      );

    return [owner, ...members];
  }, [team, page.ownerId, page.ownerName, page.ownerUsername, page.ownerAvatar]);

  const excludedUserIds = useMemo(
    () => new Set(rows.map((r) => r.userId)),
    [rows]
  );

  /** Ejecuta una mutación y traduce el error al idioma del panel. */
  const mutate = async (op: () => Promise<unknown>, fallbackMessage: string) => {
    setActionError(null);
    try {
      await op();
    } catch (err) {
      // `legacy-client` propaga el campo `error` del cuerpo como message, así que
      // un 401/403 llegaría como "Unauthorized"/"Forbidden" — inglés crudo en el
      // panel. Traducimos esos dos; el resto ya viene legible del backend.
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message =
        status === 401 || status === 403
          ? t('permissionDenied')
          : (err instanceof Error && err.message) || fallbackMessage;
      setActionError(message);
    }
  };

  const handleRoleChange = (userId: string, role: PageRole) =>
    mutate(
      () => assignRole.run({ pageId: page.id, userId, role }),
      t('errors.changeRole')
    );

  const handleAdd = (userId: string, role: PageRole) =>
    mutate(async () => {
      await assignRole.run({ pageId: page.id, userId, role });
      setIsAddingMember(false);
    }, t('errors.addMember'));

  const handleRemove = (userId: string) =>
    mutate(
      () => removeRole.run({ pageId: page.id, userId }),
      t('errors.removeMember')
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('heading')}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('subheading')}</p>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {actionError}
        </div>
      )}

      {canManage && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              {t('addMember')}
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingMember((v) => !v)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {isAddingMember ? t('cancel') : t('addAction')}
            </button>
          </div>

          {isAddingMember && (
            <AddMemberPanel
              excludedUserIds={excludedUserIds}
              busy={busy}
              onAdd={(userId, role) => void handleAdd(userId, role)}
            />
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
          {t('membersHeading', { count: rows.length })}
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-gray-100 dark:bg-gray-700/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <TeamMemberRow
                key={row.userId}
                {...row}
                canManage={canManage}
                busy={busy}
                onRoleChange={(userId, role) => void handleRoleChange(userId, role)}
                onRemove={(userId) => void handleRemove(userId)}
              />
            ))}
          </div>
        )}
      </div>

      <PermissionsReference />
    </div>
  );
};
