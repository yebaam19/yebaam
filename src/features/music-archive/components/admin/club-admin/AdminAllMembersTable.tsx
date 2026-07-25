'use client';

import { useMemo, useState, useTransition } from 'react';
import { imageUrl } from '@/lib/media/urls';
import { UserIcon } from '@/components/icons/heroicons-shim';
import {
  removeClubMember,
  setMemberRole,
} from '../../../actions/club-members.actions';
import type { ClubMemberRole } from '../../../types/music.types';
import { MoveMemberDialog } from './MoveMemberDialog';

interface Row {
  user_id: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  role: string;
  joined_at: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

interface ClubOption {
  id: string;
  name: string;
}

interface Props {
  initial: Row[];
  /** Catalogue of music clubs for the "Move" dropdown. Passed by the admin
   *  page so the table doesn't need its own fetch. */
  clubs: ClubOption[];
}

const ROLE_OPTIONS: ClubMemberRole[] = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'];

export function AdminAllMembersTable({ initial, clubs }: Props) {
  const [rows, setRows] = useState(initial);
  const [clubFilter, setClubFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [moving, setMoving] = useState<Row | null>(null);

  const filterClubs = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.club_id, r.club_name);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = clubFilter === 'all' ? rows : rows.filter((r) => r.club_id === clubFilter);

  function changeRole(row: Row, role: ClubMemberRole) {
    setError(null);
    startTransition(async () => {
      const res = await setMemberRole(row.club_id, row.user_id, role);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.club_id === row.club_id && r.user_id === row.user_id ? { ...r, role: res.data.role } : r,
        ),
      );
    });
  }

  function remove(row: Row) {
    if (!confirm(`¿Remover a ${row.full_name || row.username || 'este miembro'} de ${row.club_name}?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await removeClubMember(row.club_id, row.user_id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) => prev.filter((r) => !(r.club_id === row.club_id && r.user_id === row.user_id)));
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <label className="text-xs uppercase tracking-wide text-zinc-500">Filtrar club</label>
        <select
          value={clubFilter}
          onChange={(e) => setClubFilter(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="all">Todos ({rows.length})</option>
          {filterClubs.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          Sin miembros que mostrar.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {filtered.map((r) => {
            const photo = r.avatar_cf_image_id ? imageUrl(r.avatar_cf_image_id, 'avatar') : null;
            return (
              <li key={`${r.club_id}-${r.user_id}`} className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 flex-none overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {photo ? (
                    <img src={photo} alt="" className="h-full w-full object-cover" decoding="async" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {r.full_name || r.username || 'Miembro'}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{r.club_name}</p>
                </div>
                <select
                  value={r.role}
                  disabled={pending}
                  onChange={(e) => changeRole(r, e.target.value as ClubMemberRole)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setMoving(r)}
                  disabled={pending}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Mover
                </button>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  disabled={pending}
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {moving && (
        <MoveMemberDialog
          member={{
            user_id: moving.user_id,
            club_id: moving.club_id,
            club_name: moving.club_name,
            display_name: moving.full_name || moving.username || 'Miembro',
          }}
          clubs={clubs}
          onClose={() => setMoving(null)}
          onMoved={(toClubId) => {
            // Drop the row from the source club and insert one in the target
            // club locally so the UI reflects the move without a refresh.
            const target = clubs.find((c) => c.id === toClubId);
            setRows((prev) => {
              const without = prev.filter(
                (r) => !(r.club_id === moving.club_id && r.user_id === moving.user_id),
              );
              if (!target) return without;
              return [
                ...without,
                {
                  ...moving,
                  club_id: target.id,
                  club_name: target.name,
                  club_slug: '',
                  role: 'MEMBER',
                  joined_at: new Date().toISOString(),
                },
              ];
            });
          }}
        />
      )}
    </div>
  );
}
