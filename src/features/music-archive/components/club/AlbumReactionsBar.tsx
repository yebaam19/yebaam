'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toggleAlbumReaction } from '../../actions/music-reactions.actions';
import type { AlbumReactionCounts, AlbumReactionKind } from '../../types/music.types';

interface Props {
  albumId: string;
  initial: AlbumReactionCounts;
  signedIn: boolean;
}

const REACTIONS: Array<{ kind: AlbumReactionKind; emoji: string }> = [
  { kind: 'like', emoji: '👍' },
  { kind: 'love', emoji: '❤️' },
  { kind: 'fire', emoji: '🔥' },
  { kind: 'star', emoji: '⭐' },
];

/** Reaction row at the bottom of the album page. Optimistic UI: click toggles
 *  the badge state immediately and rolls back on server error. */
export function AlbumReactionsBar({ albumId, initial, signedIn }: Props) {
  const t = useTranslations('musica');
  const [counts, setCounts] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick(kind: AlbumReactionKind) {
    if (!signedIn) {
      setError(t('club.reactions.signInPrompt'));
      return;
    }
    setError(null);
    const prev = counts;
    // Optimistic local update.
    setCounts((c) => {
      const next = { ...c };
      if (c.userReaction === kind) {
        next[kind] = Math.max(0, c[kind] - 1);
        next.userReaction = null;
      } else {
        if (c.userReaction) next[c.userReaction] = Math.max(0, c[c.userReaction] - 1);
        next[kind] = c[kind] + 1;
        next.userReaction = kind;
      }
      return next;
    });
    startTransition(async () => {
      const res = await toggleAlbumReaction(albumId, kind);
      if (!res.ok) {
        setError(res.error);
        setCounts(prev);
      }
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t('club.reactions.heading')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const active = counts.userReaction === r.kind;
          return (
            <button
              key={r.kind}
              type="button"
              onClick={() => handleClick(r.kind)}
              disabled={pending}
              aria-label={t(`club.reactions.${r.kind}`)}
              className={
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ' +
                (active
                  ? 'border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700/50')
              }
            >
              <span className="text-base">{r.emoji}</span>
              <span className="font-medium">{counts[r.kind]}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </section>
  );
}
