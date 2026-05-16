'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { imageUrl } from '@/lib/media/urls';
import { UserIcon } from '@/components/icons/heroicons-shim';
import { removeClubMember, setMemberRole } from '../../actions/club-roles.actions';
import type { ClubMemberRole, ClubMemberRow } from '../../types/music.types';

interface Props {
  clubId: string;
  members: ClubMemberRow[];
  viewerRole: ClubMemberRole | null;
  viewerId: string | null;
}

const ROLE_COLORS: Record<ClubMemberRole, string> = {
  OWNER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ADMIN: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  MODERATOR: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  MEMBER: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

const ROLE_OPTIONS: ClubMemberRole[] = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'];

export function ClubMembersList({ clubId, members, viewerRole, viewerId }: Props) {
  const t = useTranslations('musica');
  const [items, setItems] = useState(members);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canManage = viewerRole === 'OWNER' || viewerRole === 'ADMIN';

  function displayName(m: ClubMemberRow): string {
    return m.full_name || m.username || t('club.roleMEMBER');
  }

  function handleRoleChange(target: ClubMemberRow, role: ClubMemberRole) {
    setError(null);
    startTransition(async () => {
      const res = await setMemberRole(clubId, target.user_id, role);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems((prev) =>
        prev.map((m) => (m.user_id === target.user_id ? { ...m, role: res.data.role } : m)),
      );
    });
  }

  function handleRemove(target: ClubMemberRow) {
    if (!confirm(t('club.members.removeConfirmName', { name: displayName(target) }))) return;
    setError(null);
    startTransition(async () => {
      const res = await removeClubMember(clubId, target.user_id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems((prev) => prev.filter((m) => m.user_id !== target.user_id));
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {t('club.members.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((m) => {
            const photo = m.avatar_cf_image_id ? imageUrl(m.avatar_cf_image_id, 'avatar') : null;
            const isSelf = viewerId === m.user_id;
            return (
              <li key={m.user_id} className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 flex-none overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {photo ? (
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {displayName(m)}
                  </p>
                  {m.username && (
                    <p className="truncate text-xs text-zinc-500">@{m.username}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role]}`}
                >
                  {t(`club.role${m.role}`)}
                </span>
                {canManage && !isSelf && (
                  <div className="flex items-center gap-1">
                    <select
                      value={m.role}
                      disabled={pending}
                      onChange={(e) => handleRoleChange(m, e.target.value as ClubMemberRole)}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {t(`club.role${r}`)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemove(m)}
                      disabled={pending}
                      className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    >
                      {t('club.members.remove')}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
