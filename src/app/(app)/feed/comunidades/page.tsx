'use client';

import { useState } from 'react';
import {
  useMyCommunities,
  useSuggestedCommunities,
  usePopularCommunities,
  useJoinCommunity,
  useLeaveCommunity,
} from '@/features/communities/hooks/useCommunities';
import { CommunitiesGrid } from '@/features/communities/components';
import { Community } from '@/features/communities/types/community.types';
import { FireIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';

type TabType = 'descubrir' | 'mis-comunidades' | 'sugeridas';

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('descubrir');
  const [loadingCommunityId, setLoadingCommunityId] = useState<string | null>(null);

  // Queries
  const { data: myCommunitiesData } = useMyCommunities();
  const { data: suggestedData } = useSuggestedCommunities(12);
  const { data: popularData } = usePopularCommunities(12);

  // Mutations
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
    } finally {
      setLoadingCommunityId(null);
    }
  };

  const tabs = [
    {
      id: 'descubrir' as TabType,
      label: 'Descubrir',
      icon: FireIcon,
      count: popularCommunities.length,
    },
    {
      id: 'mis-comunidades' as TabType,
      label: 'Mis Comunidades',
      icon: UserGroupIcon,
      count: myCommunities.length,
    },
    {
      id: 'sugeridas' as TabType,
      label: 'Sugeridas',
      icon: SparklesIcon,
      count: suggestedCommunities.length,
    },
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

  const isLoading = () => {
    switch (activeTab) {
      case 'descubrir':
        return !popularData;
      case 'mis-comunidades':
        return !myCommunitiesData;
      case 'sugeridas':
        return !suggestedData;
      default:
        return false;
    }
  };

  const getEmptyMessage = (): string => {
    switch (activeTab) {
      case 'descubrir':
        return 'No hay comunidades populares en este momento';
      case 'mis-comunidades':
        return 'Aún no te has unido a ninguna comunidad. ¡Explora y únete a una!';
      case 'sugeridas':
        return 'No hay comunidades sugeridas en este momento';
      default:
        return 'No se encontraron comunidades';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Comunidades
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Únete a comunidades de personas con intereses similares
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span
                  className={`
                    ml-1 py-0.5 px-2 rounded-full text-xs font-medium
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {isLoading() ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse"
            >
              <div className="h-32 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4">
                <div className="w-16 h-16 -mt-10 mb-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CommunitiesGrid
          communities={getActiveData()}
          onJoinClick={handleJoinToggle}
          loadingCommunityId={loadingCommunityId}
          emptyMessage={getEmptyMessage()}
        />
      )}
    </div>
  );
}
