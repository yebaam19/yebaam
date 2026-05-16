import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { resolveImage } from '@/lib/media/urls';
import type { FamilyMemberRole } from '../types/family.types';
import { MemberActionsMenu } from './MemberActionsMenu';

export interface FamilyMemberListItem {
  id: string;
  family_id: string;
  profile_id: string;
  role: FamilyMemberRole;
  joined_at: string;
  profile: {
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

const ROLE_STYLE: Record<FamilyMemberRole, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  member: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

interface FamilyMembersListProps {
  members: FamilyMemberListItem[];
  familyId?: string;
  showOwnerActions?: boolean;
}

export async function FamilyMembersList({
  members,
  familyId,
  showOwnerActions = false,
}: FamilyMembersListProps) {
  const t = await getTranslations('familias');
  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        {t('members.empty')}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {members.map((m) => {
        const fullName = [m.profile.firstName, m.profile.lastName].filter(Boolean).join(' ');
        const avatar = resolveImage({ avatar_url: m.profile.avatarUrl }, 'avatar');
        return (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
                aria-hidden
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                aria-hidden
              >
                {(fullName || m.profile.username || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {fullName || m.profile.username || t('members.noName')}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_STYLE[m.role]}`}
                >
                  {t(`members.roles.${m.role}`)}
                </span>
              </div>
              {m.profile.username && (
                <Link
                  href={`/${m.profile.username}`}
                  className="truncate text-xs text-zinc-500 hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  @{m.profile.username}
                </Link>
              )}
            </div>
            <time className="hidden text-xs text-zinc-400 sm:block" dateTime={m.joined_at}>
              {new Date(m.joined_at).toLocaleDateString('es', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </time>
            {showOwnerActions && familyId && (
              <MemberActionsMenu
                familyId={familyId}
                member={{ profile_id: m.profile_id, role: m.role }}
                memberLabel={fullName || m.profile.username || t('members.fallbackMemberLabel')}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
