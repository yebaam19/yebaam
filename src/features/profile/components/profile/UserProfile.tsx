'use client';

import coverPlaceholder from '@/images/cover-placeholder.png';
import { formatNumber } from '@/lib/utils';
import Avatar from '@/ui/Avatar';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import type { FriendshipStatus, UserProfile as UserProfileType } from '../../interfaces/profile.interfaces';
import EditProfileButton from './EditProfileButton';
import { FriendButton } from '@/features/friendships/components/FriendButton';

interface UserProfileProps {
  user: UserProfileType;
  loggedInUserId: string;
  friendshipInfo?: FriendshipStatus;
  customActions?: React.ReactNode; // Botones personalizados (ej: solicitud de amistad)
}

export default function UserProfile({
  user,
  loggedInUserId,
  friendshipInfo,
  customActions,
}: UserProfileProps) {
  const isOwnProfile = user.userId === loggedInUserId;
  const fullName = [user.firstName, user.secondName, user.lastName, user.secondLastName].filter(Boolean).join(' ');

  return (
    <div className="w-full bg-white dark:bg-gray-800">
      {/* Cover Photo - Constrained Width with margins */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg">
          <div className="relative h-[260px] w-full sm:h-80 lg:h-[380px]">
            <Image
              src={user.coverPhotoUrl || user.coverUrl || coverPlaceholder}
              alt="Cover"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1280px"
            />
          </div>
        </div>
      </div>

      {/* Profile Info Section - Constrained Width */}
      <div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-12 flex w-full flex-col items-center gap-4 pb-4 lg:flex-row lg:items-end lg:gap-6">
            {/* Avatar */}
            <div className="shrink-0 lg:ml-6">
              <Avatar
                src={user.avatarUrl}
                alt={fullName}
                initials={fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
                className="size-36 min-h-36 min-w-36 border-4 border-white bg-white outline-white sm:size-40 sm:min-h-40 sm:min-w-40 md:size-[150px] md:min-h-[150px] md:min-w-[150px] lg:size-[150px] lg:min-h-[150px] lg:min-w-[150px] dark:border-gray-800 dark:bg-gray-800 dark:outline-gray-800"
              />
            </div>

            {/* Info and Actions */}
            <div className="flex w-full flex-col items-center lg:flex-1 lg:flex-row lg:items-center lg:justify-between">
              {/* User Info */}
              <div className="flex w-full flex-col items-center space-y-1 lg:items-start">
                <div className="flex w-full flex-col items-center justify-center gap-2 lg:flex-row lg:items-center lg:justify-start">
                  <div className="flex w-full flex-wrap items-center justify-center gap-2 lg:justify-start">
                    <h1 className="w-auto text-center text-2xl font-bold wrap-break-word whitespace-pre-line lg:text-left lg:text-3xl">
                      {fullName || user.username}
                      {user.documentStatus === 'ACCEPTED' && (
                        <span className="ml-2 inline-block align-middle">
                          <CheckBadgeIcon
                            className="fill-primary dark:text-primary-foreground text-white"
                            width={24}
                            height={24}
                          />
                        </span>
                      )}
                    </h1>
                  </div>
                </div>
                <div className="text-gray-500 dark:text-gray-400">@{user.username}</div>

                {/* Stats */}
                <div className="flex flex-col items-center gap-1 text-sm text-gray-600 lg:flex-row lg:items-center lg:gap-3 dark:text-gray-400">
                  <span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatNumber(user._count?.posts || 0)}
                    </span>{' '}
                    publicaciones
                  </span>
                  {friendshipInfo && (
                    <Link href={`/${user.username}/friends`} className="hover:underline">
                      <span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatNumber(friendshipInfo.friendCount)}
                        </span>{' '}
                        amigos
                      </span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex w-full justify-center lg:mt-0 lg:mr-6 lg:w-auto">
                {customActions ? (
                  customActions
                ) : isOwnProfile ? (
                  <EditProfileButton user={user} />
                ) : (
                  <FriendButton userId={user.userId} variant="default" size="md" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
