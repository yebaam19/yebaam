'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  cancelJoinRequest,
  joinCommunity,
} from '@/features/communities/actions/communities.actions';
import { useLeaveCommunity } from '@/features/communities/hooks/useCommunities';
import type { ViewerJoinState } from '@/features/communities/server/communities.server';
import type { Community } from '@/features/communities/types/community.types';
import {
  UserGroupIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ArrowTrendingUpIcon,
} from '@/components/icons/heroicons-shim';
import {
  formatMembersCount,
  getCategoryLabel,
  getCategoryColor,
  getPrivacyLabel,
} from '@/features/communities/utils/communityHelpers';
import { CommunitySidebar } from './CommunitySidebar';
import { CommunityHeaderImageButton } from './CommunityHeaderImageButton';

interface CommunityLayoutShellProps {
  community: Community;
  viewerState: ViewerJoinState;
  children: ReactNode;
}

export function CommunityLayoutShell({
  community: c,
  viewerState,
  children,
}: CommunityLayoutShellProps) {
  const router = useRouter();
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinTransition, startJoinTransition] = useTransition();
  const leaveMutation = useLeaveCommunity();

  const handleJoinClick = async () => {
    setJoinError(null);
    startJoinTransition(async () => {
      if (viewerState.kind === 'member' || (c.isMember && viewerState.kind !== 'owner')) {
        try {
          await leaveMutation.mutateAsync(c.id);
        } catch (err) {
          setJoinError(err instanceof Error ? err.message : 'No se pudo salir');
          return;
        }
        router.refresh();
        return;
      }

      if (viewerState.kind === 'request_pending') {
        const result = await cancelJoinRequest(c.id);
        if (!result.ok) setJoinError(result.error);
        else router.refresh();
        return;
      }

      const result = await joinCommunity(c.id);
      if (!result.ok) {
        setJoinError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const joinButtonLabel = (() => {
    if (joinTransition || leaveMutation.isPending) return 'Procesando...';
    if (viewerState.kind === 'guest') return 'Inicia sesión para unirte';
    if (viewerState.kind === 'member' || c.isMember) return 'Miembro';
    if (viewerState.kind === 'request_pending') return 'Solicitud enviada';
    if (viewerState.kind === 'request_declined') return 'Solicitud rechazada';
    if (viewerState.kind === 'invited') return 'Aceptar invitación';
    if (c.privacy === 'PRIVATE') return 'Solicitar acceso';
    if (c.privacy === 'SECRET') return 'Solo por invitación';
    return 'Hacerse Miembro';
  })();

  const joinButtonDisabled =
    joinTransition ||
    leaveMutation.isPending ||
    viewerState.kind === 'guest' ||
    viewerState.kind === 'request_declined' ||
    (viewerState.kind === 'none' && c.privacy === 'SECRET');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative h-56 md:h-72 bg-linear-to-r from-blue-500 to-purple-500">
        {c.coverImageUrl && (
          <Image
            src={c.coverImageUrl}
            alt={c.name}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
          />
        )}
        {viewerState.kind === 'owner' && (
          <div className="absolute right-4 top-4 z-10">
            <CommunityHeaderImageButton communityId={c.id} target="cover" />
          </div>
        )}
        {viewerState.kind !== 'owner' && (
          <div className="absolute right-4 bottom-4 z-10 flex flex-col items-end gap-1">
            <button
              onClick={handleJoinClick}
              disabled={joinButtonDisabled}
              className={`px-5 py-2 rounded-lg font-medium text-sm shadow-md transition-colors ${
                viewerState.kind === 'member' || c.isMember
                  ? 'bg-white text-gray-700 hover:bg-gray-100'
                  : viewerState.kind === 'request_pending'
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : viewerState.kind === 'invited'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {joinButtonLabel}
            </button>
            {joinError && (
              <p className="text-xs text-red-600 bg-white/90 rounded px-2 py-1 max-w-xs text-right">
                {joinError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 pb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="shrink-0">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800">
                    {c.profileImageUrl ? (
                      <Image
                        src={c.profileImageUrl}
                        alt={c.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {c.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  {viewerState.kind === 'owner' && (
                    <div className="absolute bottom-0 right-0">
                      <CommunityHeaderImageButton
                        communityId={c.id}
                        target="profile"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white transition-colors hover:bg-blue-700 disabled:opacity-60 dark:ring-gray-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {c.name}
                  </h1>
                  {c.isVerified && (
                    <CheckBadgeIcon className="w-6 h-6 text-blue-500 shrink-0" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(c.category)}`}
                  >
                    {getCategoryLabel(c.category)}
                  </span>
                  {c.privacy !== 'PUBLIC' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      <LockClosedIcon className="w-3 h-3" />
                      {getPrivacyLabel(c.privacy)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  <div className="flex items-center gap-1.5">
                    <UserGroupIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatMembersCount(c.stats.membersCount)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">miembros</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {c.stats.postsCount}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">publicaciones</span>
                  </div>
                  {c.stats.growthRate > 0 && (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                      <span className="font-semibold">+{c.stats.growthRate.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 pb-12">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <CommunitySidebar
              slug={c.slug}
              isOwner={viewerState.kind === 'owner'}
              communityId={c.id}
              communityName={c.name}
            />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
