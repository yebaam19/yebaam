'use client';

import { UserGroupIcon } from '@/components/icons/heroicons-shim';
import Link from 'next/link';
import Avatar from '@/ui/Avatar';

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string | null;
}

interface ProfileFriendsGridProps {
  username: string;
  friends: Friend[];
  totalFriends: number;
}

export default function ProfileFriendsGrid({
  username,
  friends,
  totalFriends,
}: ProfileFriendsGridProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Amigos
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            {totalFriends.toLocaleString()} amigos
          </p>
        </div>
        {totalFriends > 9 && (
          <Link
            href={`/${username}/friends`}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 font-semibold transition-colors hover:underline"
          >
            Ver todos
          </Link>
        )}
      </div>

      {friends.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {friends.slice(0, 9).map((friend) => (
            <Link
              key={friend.id}
              href={`/${friend.username}`}
              className="group cursor-pointer"
            >
              <div className="aspect-square rounded-2xl overflow-hidden mb-2 relative ring-2 ring-transparent group-hover:ring-primary-500/20 transition-all">
                <Avatar
                  className="w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                  src={friend.avatar}
                  initials={friend.displayName.slice(0, 2).toUpperCase()}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-semibold truncate group-hover:text-primary-600 dark:group-hover:text-primary-500 transition-colors text-center">
                {friend.displayName}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            No hay amigos para mostrar
          </p>
        </div>
      )}
    </div>
  );
}
