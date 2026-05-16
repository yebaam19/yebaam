'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { joinClub, leaveClub } from '../../actions/club-roles.actions';
import type { ClubJoinStatus } from '../../server/clubs.server';

interface Props {
  clubId: string;
  clubSlug: string;
  initial: ClubJoinStatus;
}

/** Membership strip rendered above the tabs. Four states:
 *  signed_out → login link; none → join button; pending → waiting + cancel;
 *  approved → role pill + leave. */
export function ClubMembershipBar({ clubId, clubSlug, initial }: Props) {
  const t = useTranslations('musica');
  const router = useRouter();
  const [status, setStatus] = useState<ClubJoinStatus>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function doJoin() {
    setError(null);
    startTransition(async () => {
      const res = await joinClub(clubId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStatus({ kind: res.data.status === 'approved' ? 'approved' : 'pending', role: 'MEMBER' } as ClubJoinStatus);
      router.refresh();
    });
  }

  function doLeave() {
    if (!confirm(status.kind === 'pending' ? t('club.cancelConfirm') : t('club.leaveConfirm'))) return;
    setError(null);
    startTransition(async () => {
      const res = await leaveClub(clubId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStatus({ kind: 'none' });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0 text-sm text-zinc-700 dark:text-zinc-300">
        {renderStatus(status, t)}
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
      <div className="flex flex-none items-center gap-2">
        {status.kind === 'signed_out' && (
          <Link
            href={`/login?next=/musica/clubes/${clubSlug}` as Route}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t('club.signIn')}
          </Link>
        )}
        {status.kind === 'none' && (
          <button
            type="button"
            onClick={doJoin}
            disabled={pending}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {pending ? t('club.joining') : t('club.joinRequest')}
          </button>
        )}
        {status.kind === 'pending' && (
          <button
            type="button"
            onClick={doLeave}
            disabled={pending}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {pending ? t('club.cancelling') : t('club.cancelRequest')}
          </button>
        )}
        {status.kind === 'approved' && (
          <button
            type="button"
            onClick={doLeave}
            disabled={pending}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {pending ? t('club.leaving') : t('club.leaveCta')}
          </button>
        )}
      </div>
    </div>
  );
}

function renderStatus(s: ClubJoinStatus, t: ReturnType<typeof useTranslations<'musica'>>): React.ReactNode {
  switch (s.kind) {
    case 'signed_out':
      return t('club.signedOutPrompt');
    case 'none':
      return t('club.notMemberPrompt');
    case 'pending':
      return (
        <>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            {t('club.joinPending')}
          </span>{' '}
          {t('club.pendingReviewing')}
        </>
      );
    case 'approved':
      return (
        <>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            {t.has(`club.role${s.role}`) ? t(`club.role${s.role}`) : s.role}
          </span>{' '}
          {t('club.youAreMember')}
        </>
      );
  }
}
