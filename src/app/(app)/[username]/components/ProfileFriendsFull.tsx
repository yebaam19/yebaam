'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import type { Route } from 'next';

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  mutualFriends?: number;
  isOnline?: boolean;
}

interface ProfileFriendsFullProps {
  username: string;
  friends: Friend[];
  totalFriends: number;
  isOwnProfile: boolean;
}

export default function ProfileFriendsFull({
  username,
  friends,
  totalFriends,
  isOwnProfile,
}: ProfileFriendsFullProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'recent'>('all');

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch = friend.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'online' ? friend.isOnline :
      filter === 'recent' ? true : // TODO: Implementar lógica de recientes
      true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Amigos
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              {totalFriends.toLocaleString()} amigos
            </p>
          </div>
          
          {isOwnProfile && (
            <Link
              href={'/friends/requests' as Route}
              className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <UserPlusIcon className="w-5 h-5" />
              Solicitudes
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar amigos..."
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 rounded-xl font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-4 py-3 rounded-xl font-semibold transition-colors ${
                filter === 'online'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              En línea
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-3 rounded-xl font-semibold transition-colors ${
                filter === 'recent'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Recientes
            </button>
          </div>
        </div>
      </div>

      {/* Friends Grid */}
      {filteredFriends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Link href={`/${friend.username}` as Route} className="relative shrink-0">
                  <div className="relative">
                    <Avatar
                      className="w-20 h-20 group-hover:scale-105 transition-transform"
                      src={friend.avatar}
                      initials={friend.displayName.slice(0, 2).toUpperCase()}
                    />
                    {friend.isOnline && (
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${friend.username}` as Route}
                    className="block font-bold text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate"
                  >
                    {friend.displayName}
                  </Link>
                  {friend.mutualFriends && friend.mutualFriends > 0 && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {friend.mutualFriends} amigos en común
                    </p>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/${friend.username}` as Route}
                      className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-sm font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-center"
                    >
                      Ver perfil
                    </Link>
                    <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                      <EllipsisVerticalIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            No se encontraron amigos
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {searchQuery
              ? `No hay amigos que coincidan con "${searchQuery}"`
              : 'No hay amigos para mostrar'}
          </p>
        </div>
      )}
    </div>
  );
}
