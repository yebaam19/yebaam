'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import type { ClubRow } from './admin-clubs-table.types';

interface Props {
  row: ClubRow;
  pendingId: string | null;
  onToggleForum: (row: ClubRow) => void;
  onEdit: (row: ClubRow) => void;
  onDelete: (row: ClubRow) => void;
}

/** One club row in the admin clubs table: identity + counters on the left,
 *  forum toggle / edit / delete actions on the right. */
export function AdminClubRow({ row, pendingId, onToggleForum, onEdit, onDelete }: Props) {
  const t = useTranslations('musica.admin.clubsTable');

  return (
    <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Link
          href={`/musica/clubes/${row.slug}` as Route}
          className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-300"
        >
          {row.name}
        </Link>
        <p className="text-xs text-zinc-500">
          {row.genre_name} · {t('membersLine', { count: row.member_count })} ·{' '}
          {row.pending_count > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {t('pendingBadge', { count: row.pending_count })}
            </span>
          )}{' '}
          {t('postsLine', { count: row.post_count })} · {t('articlesLine', { count: row.article_count })}
        </p>
        <p className="line-clamp-2 text-xs text-zinc-500">{row.description}</p>
      </div>
      <div className="flex flex-none flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onToggleForum(row)}
          disabled={pendingId === row.id}
          className={
            'rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ' +
            (row.forum_enabled
              ? 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700')
          }
        >
          {pendingId === row.id ? '…' : row.forum_enabled ? t('disableForum') : t('enableForum')}
        </button>
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
        >
          {t('edit')}
        </button>
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
        >
          {t('delete')}
        </button>
      </div>
    </li>
  );
}
