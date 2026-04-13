'use client';

import { UserGroupIcon, UserPlusIcon, PaperAirplaneIcon, SparklesIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';

export type TabType = 'friends' | 'requests' | 'sent' | 'suggestions';

interface FriendsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingCount: number;
  sentCount: number;
}

export function FriendsTabs({ activeTab, onTabChange, pendingCount, sentCount }: FriendsTabsProps) {
  const tabs = [
    {
      id: 'friends' as TabType,
      label: 'Mis amigos',
      icon: UserGroupIcon,
    },
    {
      id: 'requests' as TabType,
      label: 'Solicitudes',
      icon: UserPlusIcon,
      badge: pendingCount,
    },
    {
      id: 'sent' as TabType,
      label: 'Enviadas',
      icon: PaperAirplaneIcon,
      badge: sentCount,
    },
    {
      id: 'suggestions' as TabType,
      label: 'Sugerencias',
      icon: SparklesIcon,
    },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 min-w-0">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800',
              activeTab === tab.id
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400'
            )}
          >
            <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
