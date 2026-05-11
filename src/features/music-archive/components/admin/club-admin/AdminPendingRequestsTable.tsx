'use client';

import { useState, useTransition } from 'react';
import { imageUrl } from '@/lib/media/urls';
import { UserIcon } from '@/components/icons/heroicons-shim';
import {
  approveJoinRequest,
  rejectJoinRequest,
} from '../../../actions/club-roles.actions';

interface Row {
  club_id: string;
  user_id: string;
  joined_at: string;
  club_name: string;
  club_slug: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

interface Props {
  initial: Row[];
}

export function AdminPendingRequestsTable({ initial }: Props) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(row: Row, action: 'approve' | 'reject') {
    setError(null);
    startTransition(async () => {
      const res =
        action === 'approve'
          ? await approveJoinRequest(row.club_id, row.user_id)
          : await rejectJoinRequest(row.club_id, row.user_id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) =>
        prev.filter((r) => !(r.club_id === row.club_id && r.user_id === row.user_id)),
      );
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        No hay solicitudes pendientes.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((r) => {
          const photo = r.avatar_cf_image_id ? imageUrl(r.avatar_cf_image_id, 'avatar') : null;
          return (
            <li
              key={`${r.club_id}-${r.user_id}`}
              className="flex items-center gap-3 p-3"
            >
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
                  {r.full_name || r.username || 'Usuario'}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  Club: <span className="font-medium">{r.club_name}</span> ·{' '}
                  {formatDate(r.joined_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => decide(r, 'approve')}
                disabled={pending}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => decide(r, 'reject')}
                disabled={pending}
                className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                Rechazar
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}
