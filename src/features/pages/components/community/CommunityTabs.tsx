import { FC } from 'react';
import { UsersIcon, StarIcon, ClockIcon } from '@/components/icons/heroicons-shim';

export type CommunityTabType = 'all' | 'followers' | 'fans';

interface Tab {
  id: CommunityTabType;
  label: string;
  icon: typeof UsersIcon;
  description: string;
}

interface CommunityTabsProps {
  activeTab: CommunityTabType;
  onTabChange: (tab: CommunityTabType) => void;
  counts?: {
    all: number;
    followers: number;
    fans: number;
  };
}

const tabs: Tab[] = [
  {
    id: 'all',
    label: 'Todos',
    icon: UsersIcon,
    description: 'Toda la comunidad',
  },
  {
    id: 'followers',
    label: 'Seguidores',
    icon: ClockIcon,
    description: 'Recién llegados',
  },
  {
    id: 'fans',
    label: 'Top Fans',
    icon: StarIcon,
    description: 'Más activos',
  },
];

export const CommunityTabs: FC<CommunityTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex gap-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
