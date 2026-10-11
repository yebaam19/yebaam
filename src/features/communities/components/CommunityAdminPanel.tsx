'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { inviteByUsername } from '@/features/communities/actions/moderation.actions';
import type { PendingJoinRequestPage } from '@/features/communities/server/communities.server';
import { CheckBadgeIcon, ChevronDownIcon } from '@/components/icons/heroicons-shim';
import { AddCommunityMemberForm } from './community-admin/AddCommunityMemberForm';
import { CommunityRoleManager } from './community-admin/CommunityRoleManager';
import { PendingJoinRequests } from './community-admin/PendingJoinRequests';
import type { CommunityRolePage } from '../types/communityRole.types';

interface CommunityAdminPanelProps {
  communityId: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET';
  pendingRequests: PendingJoinRequestPage;
  rolePage: CommunityRolePage | null;
}

export function CommunityAdminPanel({
  communityId,
  privacy,
  pendingRequests,
  rolePage,
}: CommunityAdminPanelProps) {
  const router = useRouter();
  const t = useTranslations('communities');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  const handleInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setError(null);
    setInviteResult(null);
    startTransition(async () => {
      const result = await inviteByUsername({ communityId, username: inviteUsername.trim() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInviteResult(t('admin.panel.inviteSuccess', { username: result.data.invitee.username }));
      setInviteUsername('');
      router.refresh();
    });
  };

  return (
    <details className="group overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm dark:border-primary-900/50 dark:bg-neutral-800">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-900 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary-800 dark:text-primary-100 [&::-webkit-details-marker]:hidden">
        <CheckBadgeIcon aria-hidden="true" className="size-5 shrink-0 text-primary-800 dark:text-primary-300" />
        <span className="min-w-0 flex-1">{t('admin.panel.title')}</span>
        {pendingRequests.items.length > 0 && <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-900 dark:bg-secondary-900/30 dark:text-secondary-200">{pendingRequests.items.length}{pendingRequests.nextCursor ? '+' : ''}</span>}
        <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-neutral-200 px-5 py-5 dark:border-neutral-700 sm:px-6">

      {rolePage && (
        <>
          <AddCommunityMemberForm communityId={communityId} />
          <CommunityRoleManager communityId={communityId} initial={rolePage} />
        </>
      )}

      {privacy === 'SECRET' && rolePage && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {t('admin.panel.inviteSectionTitle')}
          </h3>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder={t('admin.panel.invitePlaceholder')}
              className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-800 dark:focus:border-primary-300 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending || !inviteUsername.trim()}
              className="rounded-md bg-primary-800 px-4 py-2 text-sm font-medium text-white hover:bg-primary-900 disabled:opacity-50"
            >
              {t('admin.panel.inviteSubmit')}
            </button>
          </form>
          {inviteResult && (
            <p role="status" className="mt-2 text-sm text-primary-800 dark:text-primary-300">{inviteResult}</p>
          )}
        </div>
      )}

      {privacy === 'PRIVATE' && <PendingJoinRequests communityId={communityId} initial={pendingRequests} />}

      {privacy === 'PUBLIC' && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('admin.panel.publicNotice')}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      </div>
    </details>
  );
}
