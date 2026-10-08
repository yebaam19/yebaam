'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { ActionResult } from '../actions/_shared';
import type { PlanCursor, PlanPage } from '../types/communityPlan.types';

/** Component-local cache: discarded when the server snapshot or viewer changes. */
export function usePlanPage<T extends { id: string }>(
  initial: PlanPage<T>, load: (cursor: PlanCursor) => Promise<ActionResult<PlanPage<T>>>,
) {
  const [page, setPage] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('communities.plans');

  function loadMore() {
    if (!page.nextCursor || pending) return;
    const cursor = page.nextCursor;
    setError(null);
    startTransition(async () => {
      try {
        const result = await load(cursor);
        if (!result.ok) { setError(result.error); return; }
        setPage((previous) => ({
          items: [...new Map([...previous.items, ...result.data.items].map((item) => [item.id, item])).values()],
          nextCursor: result.data.nextCursor,
        }));
      } catch { setError(t('requestError')); }
    });
  }

  return { ...page, pending, error, loadMore };
}
