'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LockClosedIcon } from '@/components/icons/heroicons-shim';
import { cancelJoinRequest, requestPrivateCommunityAccess } from '../actions/members.actions';
import type { ViewerJoinState } from '../server/communities/communities-members.server';
import type { PrivateCommunityPreview } from '../server/communities/communities-private-preview.server';

export function CommunityPrivatePreview({
  community,
  viewerState,
}: {
  community: PrivateCommunityPreview;
  viewerState: ViewerJoinState;
}) {
  const t = useTranslations('communities');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const pending = viewerState.kind === 'request_pending';
  const declined = viewerState.kind === 'request_declined';

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = pending
        ? await cancelJoinRequest(community.id)
        : await requestPrivateCommunityAccess(community.id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <main className="mx-auto flex min-h-[65dvh] w-full max-w-3xl items-center px-4 py-10 sm:px-6">
      <section className="w-full overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm dark:border-primary-900/60 dark:bg-neutral-800">
        <div className="h-24 bg-primary-800 sm:h-32" aria-hidden="true" />
        <div className="px-5 pb-7 sm:px-8 sm:pb-8">
          <div className="-mt-7 mb-5 flex size-14 items-center justify-center rounded-xl border-4 border-white bg-secondary-100 text-primary-900 shadow-sm dark:border-neutral-800 dark:bg-secondary-900/50 dark:text-secondary-200">
            <LockClosedIcon aria-hidden="true" className="size-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-800 dark:text-primary-300">
            {t('privatePreview.label')}
          </p>
          <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
            {community.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {t('privatePreview.description')}
          </p>
          {(pending || declined) && (
            <p className="mt-4 rounded-lg bg-secondary-50 px-3 py-2 text-sm text-secondary-900 dark:bg-secondary-900/20 dark:text-secondary-200">
              {t(pending ? 'privatePreview.pending' : 'privatePreview.declined')}
            </p>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!declined && (
              <button type="button" onClick={submit} disabled={isPending}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:opacity-60">
                {isPending ? t('detail.joinButton.processing') : pending
                  ? t('privatePreview.cancel') : t('detail.joinButton.requestAccess')}
              </button>
            )}
            <Link href="/feed/comunidades" className="inline-flex min-h-10 items-center text-sm font-medium text-primary-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:text-primary-300">
              {t('privatePreview.back')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
