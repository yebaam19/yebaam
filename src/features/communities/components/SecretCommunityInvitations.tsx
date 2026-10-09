'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { getMoreSecretCommunityInvitations } from '../actions/secretCommunityInvitations.actions';
import type { SecretCommunityInvitationPage } from '../server/communities/communities-invitations.server';

export function SecretCommunityInvitations({
  initialPage,
}: {
  initialPage: SecretCommunityInvitationPage;
}) {
  const t = useTranslations('communities.list.invitations');
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) return null;

  const loadMore = () => {
    if (!nextCursor || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await getMoreSecretCommunityInvitations(nextCursor);
      if (!result.ok) {
        setError(t('loadError'));
        return;
      }
      setItems((current) => [...current, ...result.data.items]);
      setNextCursor(result.data.nextCursor);
    });
  };

  return (
    <section aria-labelledby="secret-community-invitations-title" className="mb-6 overflow-hidden rounded-xl border border-secondary-200 bg-secondary-50/80 dark:border-secondary-900/60 dark:bg-secondary-950/20">
      <div className="flex items-start gap-3 border-b border-secondary-200/80 px-4 py-3 dark:border-secondary-900/60 sm:px-5">
        <span className="mt-0.5 rounded-lg bg-secondary-100 p-2 text-primary-900 dark:bg-secondary-900/50 dark:text-secondary-200" aria-hidden="true">
          <LockKeyhole className="h-4 w-4" />
        </span>
        <div>
          <h2 id="secret-community-invitations-title" className="text-sm font-semibold text-primary-950 dark:text-secondary-100">{t('title')}</h2>
          <p className="mt-0.5 text-xs text-primary-900/75 dark:text-secondary-200/75">{t('description')}</p>
        </div>
      </div>
      <ul className="divide-y divide-secondary-200/70 dark:divide-secondary-900/50">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{item.communityName}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300">{t('secretLabel')}</p>
            </div>
            <Link
              href={`/feed/comunidades/${encodeURIComponent(item.communitySlug)}`}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-primary-800 transition-colors hover:bg-secondary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:text-secondary-200 dark:hover:bg-secondary-900/40"
            >
              {t('review')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {nextCursor && (
        <div className="border-t border-secondary-200/80 px-4 py-2.5 dark:border-secondary-900/60 sm:px-5">
          <button type="button" onClick={loadMore} disabled={isPending} className="min-h-10 rounded-lg px-2 text-sm font-semibold text-primary-800 hover:bg-secondary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:opacity-60 dark:text-secondary-200 dark:hover:bg-secondary-900/40">
            {isPending ? t('loading') : t('more')}
          </button>
          {error && <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>}
        </div>
      )}
    </section>
  );
}
