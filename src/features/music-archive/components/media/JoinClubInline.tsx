'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useState, useTransition } from 'react';
import { joinClub } from '../../actions/club-members.actions';

interface Props {
  clubId: string;
  clubName: string;
  clubSlug: string;
}

type JoinState =
  | { kind: 'idle' }
  | { kind: 'signed_out' }
  | { kind: 'pending' }
  | { kind: 'approved' }
  | { kind: 'error'; message: string };

/** Compact inline join-club button used inside the music-media lightbox.
 *  Optimistically goes through `joinClub` — the action is idempotent and
 *  returns the row's current status, so we don't pre-fetch membership. */
export function JoinClubInline({ clubId, clubName, clubSlug }: Props) {
  const [state, setState] = useState<JoinState>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await joinClub(clubId);
      if (!res.ok) {
        if (res.error.toLowerCase().includes('inicia sesión')) {
          setState({ kind: 'signed_out' });
          return;
        }
        setState({ kind: 'error', message: res.error });
        return;
      }
      setState({ kind: res.data.status });
    });
  }

  if (state.kind === 'signed_out') {
    return (
      <Link
        href={`/login?next=/musica/clubes/${clubSlug}` as Route}
        className="inline-flex items-center rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
      >
        Inicia sesión para unirte a {clubName}
      </Link>
    );
  }

  if (state.kind === 'approved') {
    return (
      <Link
        href={`/musica/clubes/${clubSlug}` as Route}
        className="inline-flex items-center rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
      >
        Ya eres miembro · Ir al club
      </Link>
    );
  }

  if (state.kind === 'pending') {
    return (
      <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        Solicitud enviada a {clubName}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
      >
        {pending ? 'Enviando…' : `Únete a ${clubName}`}
      </button>
      {state.kind === 'error' && (
        <span className="text-xs text-rose-600 dark:text-rose-400">{state.message}</span>
      )}
    </div>
  );
}
