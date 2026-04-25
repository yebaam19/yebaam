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
    { id: 'friends' as TabType, label: 'Amigos', icon: UserGroupIcon },
    { id: 'requests' as TabType, label: 'Recibidas', icon: UserPlusIcon, badge: pendingCount },
    { id: 'sent' as TabType, label: 'Enviadas', icon: PaperAirplaneIcon, badge: sentCount },
    { id: 'suggestions' as TabType, label: 'Sugerencias', icon: SparklesIcon },
  ];

  return (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-1 min-w-fit items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm',
              isActive
                ? 'bg-white text-primary-700 shadow-sm dark:bg-neutral-800 dark:text-primary-400'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
            )}
          >
            <tab.icon className="size-4 shrink-0" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  'ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
                )}
              >
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
