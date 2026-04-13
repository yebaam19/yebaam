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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statsCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-800"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
