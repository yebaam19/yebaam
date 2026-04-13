'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserGroupIcon,
  UsersIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PlusIcon,
} from '@/components/icons/heroicons-shim';
import type { Group } from '../types/group.types';
import { useJoinGroup } from '../hooks/useGroups';
import { useGroupsUIStore } from '../store/groupsUIStore';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const { mutate: joinGroup, isPending: isJoining } = useJoinGroup();
  const addRecentlyViewed = useGroupsUIStore((state) => state.addRecentlyViewed);

  const handleJoinGroup = () => {
    joinGroup(group.id);
  };

  const handleViewGroup = () => {
    addRecentlyViewed(group.id);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="relative h-32 bg-linear-to-br from-blue-500 to-purple-600">
        {group.coverImageUrl ? (
          <Image
            src={group.coverImageUrl}
            alt={group.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <UserGroupIcon className="h-12 w-12 text-white/50" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full flex items-center gap-1">
            {group.privacy === 'public' ? (
              <GlobeAltIcon className="h-3.5 w-3.5 text-white" />
            ) : (
              <LockClosedIcon className="h-3.5 w-3.5 text-white" />
            )}
            <span className="text-xs text-white capitalize">
              {group.privacy === 'public' ? 'Público' : 'Privado'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/grupos/${group.id}`} className="block hover:underline mb-2">
          <h3 className="font-bold text-lg text-neutral-900 dark:text-white line-clamp-1">
            {group.name}
          </h3>
        </Link>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
          {group.description}
        </p>

        {/* Creator Info */}
        {group.creatorName && (
          <div className="flex items-center gap-2 mb-3">
            <div className="relative h-6 w-6 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
              {group.creatorAvatar ? (
                <Image
                  src={group.creatorAvatar}
                  alt={group.creatorName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {group.creatorName.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Creado por <span className="font-medium text-neutral-700 dark:text-neutral-300">{group.creatorName}</span>
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          <div className="flex items-center gap-1">
            <UsersIcon className="h-4 w-4" />
            <span>{group.memberCount.toLocaleString()} miembros</span>
          </div>
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>{group.postCount} publicaciones</span>
          </div>
        </div>

        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            {group.category}
          </span>
        </div>

        {/* Action Button */}
        {group.isMember ? (
          <Link
            href={`/grupos/${group.id}`}
            onClick={handleViewGroup}
            className="w-full px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            Ver grupo
          </Link>
        ) : (
          <button
            onClick={handleJoinGroup}
            disabled={isJoining}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isJoining ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uniéndose...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4" />
                Unirse
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
