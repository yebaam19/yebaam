'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useMyCommunities,
  useSuggestedCommunities,
  usePopularCommunities,
  useJoinCommunity,
  useLeaveCommunity,
} from '@/features/communities/hooks/useCommunities';
import { CommunitiesGrid } from '@/features/communities/components';
import { CreateCommunityDialog } from '@/features/communities/components/CreateCommunityDialog';
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
  canCreate: boolean;
}

export function CommunitiesTabsClient({
  initialPopular,
  initialMine,
  initialSuggested,
  canCreate,
}: CommunitiesTabsClientProps) {
  const t = useTranslations('communities');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('descubrir');
  const [loadingCommunityId, setLoadingCommunityId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: myCommunitiesData } = useMyCommunities(initialMine);
  const { data: suggestedData } = useSuggestedCommunities(12, initialSuggested);
  const { data: popularData } = usePopularCommunities(12, initialPopular);

  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  const myCommunities = myCommunitiesData?.data || [];
  const suggestedCommunities = suggestedData?.data || [];
  const popularCommunities = popularData?.data || [];

  const handleJoinToggle = async (community: Community) => {
    setLoadingCommunityId(community.id);
    try {
      if (community.isMember) {
        await leaveMutation.mutateAsync(community.id);
      } else {
        await joinMutation.mutateAsync(community.id);
      }
      router.refresh();
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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('list.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('list.subtitle')}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            {t('create.trigger')}
          </button>
        )}
      </div>

      <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span
                  className={`ml-1 py-0.5 px-2 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <CommunitiesGrid
        communities={getActiveData()}
        onJoinClick={handleJoinToggle}
        loadingCommunityId={loadingCommunityId}
        emptyMessage={getEmptyMessage()}
      />

      {canCreate && (
        <CreateCommunityDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </>
  );
}
