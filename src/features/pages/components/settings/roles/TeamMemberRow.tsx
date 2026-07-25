'use client';

import { FC } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  UserCircleIcon,
  XMarkIcon,
  CheckBadgeIcon,
} from '@/components/icons/heroicons-shim';
import { resolveImageRef } from '@/lib/media/urls';
import type { PageRole } from '@/features/pages/types/page.types';
import {
  ASSIGNABLE_PAGE_ROLES,
  PAGE_ROLE_BORDERS,
  PAGE_ROLE_STYLES,
} from '@/features/pages/components/detail/team/roles';

export interface TeamMemberRowProps {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  role: PageRole;
  joinedAt?: string;
  /** El propietario no se edita ni se retira desde aquí. */
  isOwner: boolean;
  /** Sólo el propietario de la página ve los controles. */
  canManage: boolean;
  busy: boolean;
  onRoleChange: (userId: string, role: PageRole) => void;
  onRemove: (userId: string) => void;
}

export const TeamMemberRow: FC<TeamMemberRowProps> = ({
  userId,
  displayName,
  username,
  avatarUrl,
  role,
  joinedAt,
  isOwner,
  canManage,
  busy,
  onRoleChange,
  onRemove,
}) => {
  const t = useTranslations('pages.settings.roles');
  const locale = useLocale();
  const avatar = resolveImageRef(avatarUrl, 'avatar');

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="relative shrink-0">
        {avatar ? (
          <Image
            src={avatar}
            alt=""
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <UserCircleIcon className="w-12 h-12 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {displayName}
          </p>
          {isOwner && (
            <CheckBadgeIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {username && `@${username}`}
          {username && joinedAt && ' · '}
          {joinedAt && (
            <>
              {t('joinedSince')}{' '}
              {new Date(joinedAt).toLocaleDateString(locale, {
                month: 'short',
                year: 'numeric',
              })}
            </>
          )}
        </p>
      </div>

      <span
        className={`px-3 py-1 text-xs font-medium rounded-full border ${PAGE_ROLE_STYLES[role]} ${PAGE_ROLE_BORDERS[role]}`}
      >
        {t(`labels.${role}`)}
      </span>

      {!isOwner && canManage && (
        <div className="flex items-center gap-2">
          <select
            value={role}
            disabled={busy}
            aria-label={`${t('heading')} — ${displayName}`}
            onChange={(e) => onRoleChange(userId, e.target.value as PageRole)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          >
            {ASSIGNABLE_PAGE_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`labels.${r}`)}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={busy}
            onClick={() => onRemove(userId)}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
            title={t('removeMember')}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
