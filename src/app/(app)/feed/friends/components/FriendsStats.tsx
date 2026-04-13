'use client';

import { UserGroupIcon, UserPlusIcon, SparklesIcon, PaperAirplaneIcon } from '@/components/icons/heroicons-shim';

interface FriendsStatsProps {
  totalFriends: number;
  closeFriends: number;
  pendingRequests: number;
  sentRequests: number;
  suggestions: number;
}

export function FriendsStats({ totalFriends, closeFriends, pendingRequests, sentRequests, suggestions }: FriendsStatsProps) {
  const statsCards = [
    {
      label: 'Total de amigos',
      value: totalFriends,
      icon: UserGroupIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Amigos cercanos',
      value: closeFriends,
      icon: SparklesIcon,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Solicitudes recibidas',
      value: pendingRequests,
      icon: UserPlusIcon,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Solicitudes enviadas',
      value: sentRequests,
      icon: PaperAirplaneIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Sugerencias',
      value: suggestions,
      icon: SparklesIcon,
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
      {statsCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-neutral-900 rounded-xl p-3 sm:p-4 shadow-sm border border-neutral-200 dark:border-neutral-800 min-w-0"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
