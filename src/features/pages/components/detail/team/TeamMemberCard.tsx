import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { resolveImageRef } from '@/lib/media/urls';
import type { PageRole } from '@/features/pages/types/page.types';
import { PAGE_ROLE_LABELS, PAGE_ROLE_STYLES } from './roles';

export interface TeamMemberCardProps {
  /** Nombre humano ya resuelto por getUserDisplayName — nunca username/email. */
  displayName: string;
  /** Ausente cuando el perfil no es enlazable; la tarjeta se renderiza sin link. */
  username?: string;
  avatarUrl?: string;
  /** Presentación / bio del integrante (PDF §4). */
  presentation?: string;
  role: PageRole;
}

const SHELL = 'flex items-center gap-3 rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm';

/** Una persona del equipo (PDF §4 "Equipo de Trabajo"). Componente presentacional. */
export const TeamMemberCard: FC<TeamMemberCardProps> = ({
  displayName,
  username,
  avatarUrl,
  presentation,
  role,
}) => {
  const avatar = resolveImageRef(avatarUrl, 'avatar');

  const body = (
    <>
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
        {avatar ? (
          <Image
            src={avatar}
            alt=""
            width={56}
            height={56}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400 dark:text-gray-500">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {displayName}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PAGE_ROLE_STYLES[role]}`}
        >
          {PAGE_ROLE_LABELS[role]}
        </span>
        {presentation && (
          <p className="mt-2 line-clamp-3 text-xs text-gray-500 dark:text-gray-400">
            {presentation}
          </p>
        )}
      </div>
    </>
  );

  if (!username) return <div className={SHELL}>{body}</div>;

  return (
    <Link
      href={`/${username}` as Route}
      className={`${SHELL} transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60`}
    >
      {body}
    </Link>
  );
};
