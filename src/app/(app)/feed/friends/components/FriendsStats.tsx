'use client';

import {
  UserGroupIcon,
  UserPlusIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  HeartIcon,
} from '@/components/icons/heroicons-shim';

interface FriendsStatsProps {
  totalFriends: number;
  closeFriends: number;
  pendingRequests: number;
  sentRequests: number;
  suggestions: number;
}

export function FriendsStats({
  totalFriends,
  closeFriends,
  pendingRequests,
  sentRequests,
  suggestions,
}: FriendsStatsProps) {
  const statsCards = [
    { label: 'Total de amigos', value: totalFriends, icon: UserGroupIcon },
    { label: 'Amigos cercanos', value: closeFriends, icon: HeartIcon },
    { label: 'Solicitudes recibidas', value: pendingRequests, icon: UserPlusIcon },
    { label: 'Solicitudes enviadas', value: sentRequests, icon: PaperAirplaneIcon },
    { label: 'Sugerencias', value: suggestions, icon: SparklesIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
      {statsCards.map((stat, index) => (
        <div
          key={index}
          className="min-w-0 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <stat.icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg leading-tight font-bold text-neutral-900 sm:text-xl dark:text-white">
                {stat.value}
              </p>
              <p className="truncate text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
