'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { ActionResult } from '../actions/_shared';
import type { LibraryCursor } from '../types/communityLibrary.types';

type Page<T> = { items: T[]; nextCursor: LibraryCursor | null };

export function useLibraryPage<T extends { id: string }>(initial: Page<T>, load: (cursor: LibraryCursor) => Promise<ActionResult<Page<T>>>, loadError?: string, refreshKey?: string) {
  const [page, setPage] = useState(initial);
  const [snapshot, setSnapshot] = useState(refreshKey);
  // Refresh changed server data without remounting rows and losing keyboard focus.
  if (snapshot !== refreshKey) { setSnapshot(refreshKey); setPage(initial); }
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const t = useTranslations('communities.library');
  function loadMore() {
    if (!page.nextCursor || inFlight.current) return;
    inFlight.current = true;
    const cursor = page.nextCursor;
    setError(null);
    startTransition(async () => {
      try {
        const result = await load(cursor);
        if (!result.ok) { setError(result.error); return; }
        setPage((previous) => ({ items: [...new Map([...previous.items, ...result.data.items].map((item) => [item.id, item])).values()], nextCursor: result.data.nextCursor }));
      } catch { setError(loadError ?? t('loadError')); }
      finally { inFlight.current = false; }
    });
  }
  return { ...page, pending, error, loadMore };
}
