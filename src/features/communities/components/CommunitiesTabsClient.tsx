'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useMyCommunities,
  useSuggestedCommunities,
  usePopularCommunities,
  useJoinCommunity,
} from '@/features/communities/hooks/useCommunities';
import { CommunitiesGrid } from '@/features/communities/components';
import { CreateCommunityDialog } from '@/features/communities/components/CreateCommunityDialog';
import { SecretCommunityInvitations } from '@/features/communities/components/SecretCommunityInvitations';
import type { SecretCommunityInvitationPage } from '@/features/communities/server/communities/communities-invitations.server';
import {
  Community,
} from '@/features/communities/types/community.types';
import {
  FireIcon,
  UserGroupIcon,
  SparklesIcon,
  PlusIcon,
} from '@/components/icons/heroicons-shim';

type TabType = 'descubrir' | 'mis-comunidades' | 'sugeridas';

interface CommunitiesTabsClientProps {
  initialPopular: Community[];
  initialMine: Community[];
  initialSuggested: Community[];
  initialInvitations: SecretCommunityInvitationPage;
  canCreate: boolean;
}

export function CommunitiesTabsClient({
  initialPopular,
  initialMine,
  initialSuggested,
  initialInvitations,
  canCreate,
}: CommunitiesTabsClientProps) {
  const t = useTranslations('communities');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('descubrir');
  const [loadingCommunityId, setLoadingCommunityId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: myCommunitiesData } = useMyCommunities(initialMine);
  const { data: suggestedData } = useSuggestedCommunities(12, initialSuggested);
  const { data: popularData } = usePopularCommunities(12, initialPopular);

  const joinMutation = useJoinCommunity();

  const myCommunities = myCommunitiesData?.data || [];
  const suggestedCommunities = suggestedData?.data || [];
  const popularCommunities = popularData?.data || [];

  const handleJoin = async (community: Community) => {
    if (community.isMember) return;
    setLoadingCommunityId(community.id);
    setJoinError(null);
    try {
      await joinMutation.mutateAsync(community.id);
      router.refresh();
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : t('list.joinError'));
    } finally {
      setLoadingCommunityId(null);
    }
  };

  const tabs = [
    { id: 'descubrir' as TabType, label: t('list.tabs.discover'), icon: FireIcon, count: popularCommunities.length },
    { id: 'mis-comunidades' as TabType, label: t('list.tabs.myCommunities'), icon: UserGroupIcon, count: myCommunities.length },
    { id: 'sugeridas' as TabType, label: t('list.tabs.suggested'), icon: SparklesIcon, count: suggestedCommunities.length },
  ];

  const getActiveData = (): Community[] => {
    switch (activeTab) {
      case 'descubrir':
        return popularCommunities;
      case 'mis-comunidades':
        return myCommunities;
      case 'sugeridas':
        return suggestedCommunities;
      default:
        return [];
    }
  };

  const getEmptyMessage = (): string => {
    switch (activeTab) {
      case 'descubrir':
        return t('list.empty.discover');
      case 'mis-comunidades':
        return t('list.empty.myCommunities');
      case 'sugeridas':
        return t('list.empty.suggested');
      default:
        return t('list.empty.default');
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">{t('list.title')}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {t('list.subtitle')}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
          >
            <PlusIcon className="h-4 w-4" />
            {t('create.trigger')}
          </button>
        )}
      </div>

      <SecretCommunityInvitations key={initialInvitations.items.map((item) => item.id).join(',')} initialPage={initialInvitations} />

      <div className="mb-5 overflow-x-auto border-b border-neutral-200 dark:border-neutral-700">
        <nav className="-mb-px flex min-w-max gap-5" aria-label={t('list.title')}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-800 ${
                  isActive
                    ? 'border-primary-800 text-primary-800 dark:border-primary-300 dark:text-primary-300'
                    : 'border-transparent text-neutral-600 hover:border-primary-300 hover:text-primary-800 dark:text-neutral-300 dark:hover:text-primary-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                    isActive
                      ? 'bg-secondary-100 text-primary-900 dark:bg-secondary-900/30 dark:text-secondary-200'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {joinError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{joinError}</p>}
      <CommunitiesGrid
        communities={getActiveData()}
        onJoinClick={handleJoin}
        loadingCommunityId={loadingCommunityId}
        emptyMessage={getEmptyMessage()}
      />

      {canCreate && (
        <CreateCommunityDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </>
  );
}
