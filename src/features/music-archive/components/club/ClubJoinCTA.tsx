'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { joinClub } from '../../actions/club-roles.actions';
import type { ClubJoinStatus } from '../../server/clubs.server';

interface Props {
  clubId: string;
  clubSlug: string;
  /** Current viewer status. The CTA only renders for kinds `signed_out` and
   *  `none` — for pending it shows a passive note, for approved it returns null. */
  status: ClubJoinStatus;
  /** Caller-supplied label to clarify the action context. */
  label?: string;
}

/** Inline join button for empty-state cards in Posts/Articulos/Miembros. */
export function ClubJoinCTA({ clubId, clubSlug, status, label }: Props) {
  const t = useTranslations('musica');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status.kind === 'approved') return null;

  function doJoin() {
    setError(null);
    startTransition(async () => {
      const res = await joinClub(clubId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {label ?? t('club.ctaJoinDefault')}
      </p>
      <div className="mt-3">
        {status.kind === 'signed_out' && (
          <Link
            href={`/login?next=/musica/clubes/${clubSlug}` as Route}
            className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t('club.signIn')}
          </Link>
        )}
        {status.kind === 'none' && (
          <button
            type="button"
            onClick={doJoin}
            disabled={pending}
            className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {pending ? t('club.joining') : t('club.joinRequest')}
          </button>
        )}
        {status.kind === 'pending' && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            {t('club.joinPending')}
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
