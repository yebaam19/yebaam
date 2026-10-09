'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { invalidate } from '@/lib/hooks/cacheStore';
import { getMoreCommunityJoinRequests } from '../../actions/communityJoinRequests.actions';
import { approveJoinRequest, declineJoinRequest } from '../../actions/join-requests.actions';
import type { PendingJoinRequestPage } from '../../server/communities/communities-admin.server';

export function PendingJoinRequests({ communityId, initial }: {
  communityId: string; initial: PendingJoinRequestPage;
}) {
  const router = useRouter();
  const t = useTranslations('communities');
  const [page, setPage] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function review(requestId: string, decision: 'approve' | 'decline') {
    setError(null);
    startTransition(async () => {
      const result = decision === 'approve'
        ? await approveJoinRequest(requestId) : await declineJoinRequest(requestId);
      if (!result.ok) { setError(result.error); return; }
      setPage((current) => ({ ...current, items: current.items.filter((item) => item.id !== requestId) }));
      invalidate('communities::detail');
      if (decision === 'approve') {
        invalidate('communities::members');
        invalidate('communities::my');
      }
      router.refresh();
    });
  }

  function loadMore() {
    if (!page.nextCursor || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await getMoreCommunityJoinRequests({ communityId, cursor: page.nextCursor });
      if (!result.ok) { setError(result.error); return; }
      setPage((current) => ({
        items: [...new Map([...current.items, ...result.data.items].map((item) => [item.id, item])).values()],
        nextCursor: result.data.nextCursor,
      }));
    });
  }

  return <section aria-labelledby="community-pending-requests-title" className="space-y-3">
    <h3 id="community-pending-requests-title" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
      {t('admin.panel.pendingTitle')}
    </h3>
    {page.items.length === 0 && !page.nextCursor ? (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin.panel.pendingEmpty')}</p>
    ) : (
      <ul className="space-y-3">
        {page.items.map((req) => <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
          <div className="flex min-w-0 items-center gap-3">
            {req.avatar ? <Image src={req.avatar} alt="" width={36} height={36} className="size-9 rounded-full object-cover" unoptimized />
              : <div aria-hidden="true" className="size-9 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700" />}
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900 dark:text-white">{req.name}</p>
              {req.username && <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">@{req.username}</p>}
              {req.message && <p className="mt-1 break-words text-xs text-neutral-600 dark:text-neutral-300">{req.message}</p>}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => review(req.id, 'approve')} disabled={pending}
              className="min-h-9 rounded-md bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 disabled:opacity-50">
              {t('admin.panel.approve')}
            </button>
            <button type="button" onClick={() => review(req.id, 'decline')} disabled={pending}
              className="min-h-9 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              aria-label={t('admin.panel.declineAria')}><XMarkIcon className="size-3.5" /></button>
          </div>
        </li>)}
      </ul>
    )}
    {page.nextCursor && <button type="button" onClick={loadMore} disabled={pending}
      className="min-h-10 rounded-lg border border-primary-700 px-4 text-sm font-medium text-primary-800 hover:bg-primary-50 disabled:opacity-50 dark:border-primary-300 dark:text-primary-200 dark:hover:bg-primary-900/20">
      {pending ? t('admin.panel.loadingMore') : t('admin.panel.loadMore')}
    </button>}
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </section>;
}
