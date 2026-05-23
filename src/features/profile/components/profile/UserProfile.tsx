'use client';

import { formatNumber } from '@/lib/utils';
import Avatar from '@/ui/Avatar';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { FriendshipStatus, UserProfile as UserProfileType } from '../../interfaces/profile.interfaces';
import EditProfileButton from './EditProfileButton';
import { FriendButton } from '@/features/friendships/components/FriendButton';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import MessageButton from './MessageButton';
import ProfileFollowStub from './ProfileFollowStub';
import ProfessionalProfileButton from './ProfessionalProfileButton';
import ProfileActionsMenu from './ProfileActionsMenu';
import ProfileSocialLinks from './ProfileSocialLinks';
import { coverTransformStyle } from '../../utils/coverTransform';
import { AcademicCapIcon, BriefcaseIcon } from '@/components/icons/heroicons-shim';
import { InsigniaList } from './InsigniaList';
import { BadgeStrip } from './BadgeStrip';
import { PendingBadgeBanner } from './PendingBadgeBanner';

interface UserProfileProps {
  user: UserProfileType;
  loggedInUserId: string;
  friendshipInfo?: FriendshipStatus;
  customActions?: React.ReactNode; // Botones personalizados (ej: solicitud de amistad)
  /** Whether the user has a professional profile visible to the current viewer. */
  professionalProfileExists?: boolean;
}

function GradientCover() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-linear-to-br from-emerald-300 via-emerald-100 to-blue-200">
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          fill="rgba(255,255,255,0.35)"
          d="M0,160 C240,260 480,60 720,140 C960,220 1200,80 1440,180 L1440,320 L0,320 Z"
        />
        <path
          fill="rgba(255,255,255,0.55)"
          d="M0,220 C240,300 480,160 720,210 C960,260 1200,180 1440,240 L1440,320 L0,320 Z"
        />
      </svg>
    </div>
  );
}

export default function UserProfile({
  user,
  loggedInUserId,
  friendshipInfo,
  customActions,
  professionalProfileExists = false,
}: UserProfileProps) {
  const t = useTranslations('profile.header');
  const isOwnProfile = user.userId === loggedInUserId;
  const fullName = [user.firstName, user.secondName, user.lastName, user.secondLastName].filter(Boolean).join(' ');
  const coverSrc = user.coverPhotoUrl || user.coverUrl || null;
  const friendshipState = useFriendshipsStore((state) => state.getFriendshipStatus(user.userId));
  const isFriends = friendshipState === 'friends';

  return (
    <div className="w-full bg-white dark:bg-gray-800">
      {isOwnProfile && <PendingBadgeBanner pending={user.pendingBadges ?? []} />}

      {/* Cover Photo - Constrained Width with margins */}
      <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg">
          <div className="relative h-56 w-full sm:h-72 md:h-80 lg:h-96">
            {coverSrc ? (
              <Image
                src={coverSrc}
                alt="Cover"
                fill
                className="object-cover"
                style={coverTransformStyle({
                  offsetX: user.coverOffsetX ?? 50,
                  offsetY: user.coverOffsetY ?? 50,
                  zoom: user.coverZoom ?? 100,
                })}
                priority
                sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1280px"
              />
            ) : (
              <GradientCover />
            )}
          </div>
        </div>
      </div>

      {/* Badges strip — sits between the cover and the avatar/info block per spec. */}
      <BadgeStrip badges={user.badges ?? []} />

      {/* Profile Info Section - Constrained Width */}
      <div>
        <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">
          <div className="relative -mt-14 flex w-full min-w-0 flex-col items-center gap-3 pb-4 sm:-mt-16 lg:-mt-20 lg:flex-row lg:items-start lg:gap-5">
            {/* Avatar peeks over the cover. Info column below uses lg:pt-20 so the
                heading sits below the cover instead of overlapping it. */}
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
                className="size-28 min-h-28 min-w-28 border-4 border-white bg-white outline-white sm:size-36 sm:min-h-36 sm:min-w-36 md:size-40 md:min-h-40 md:min-w-40 lg:size-[150px] lg:min-h-[150px] lg:min-w-[150px] dark:border-gray-800 dark:bg-gray-800 dark:outline-gray-800"
              />
            </div>

            {/* Info and Actions — on lg the row is pulled up by `-mt-20` above
                so the avatar peeks. We add `lg:pt-20` here so the heading itself
                drops back to align with the cover bottom and never overlaps. */}
            <div className="flex w-full min-w-0 flex-col items-center lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:pt-20">
              {/* User Info */}
              <div className="flex w-full min-w-0 flex-col items-center space-y-1 lg:items-start">
                <div className="flex w-full min-w-0 flex-col items-center justify-center gap-2 lg:flex-row lg:items-center lg:justify-start">
                  <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 lg:justify-start">
                    <h1 className="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-2 text-center text-2xl leading-tight font-bold wrap-break-word text-gray-900 sm:text-3xl lg:justify-start lg:text-left dark:text-white">
                      <span className="min-w-0 max-w-full wrap-anywhere">{fullName || user.username}</span>
                      <InsigniaList items={user.insignias ?? []} />
                    </h1>
                  </div>
                </div>
                <div className="max-w-full text-center text-sm break-all text-gray-500 sm:text-base lg:text-left dark:text-gray-400">@{user.username}</div>

                {/* Tagline — occupation + university. Hidden when both are empty. */}
                {(user.workPlace?.trim() || user.studyPlace?.trim()) && (
                  <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-gray-600 lg:justify-start dark:text-gray-400">
                    {user.workPlace?.trim() && (
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                        <BriefcaseIcon className="size-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                        <span className="truncate">{user.workPlace}</span>
                      </span>
                    )}
                    {user.workPlace?.trim() && user.studyPlace?.trim() && (
                      <span className="hidden text-gray-300 sm:inline dark:text-gray-600" aria-hidden>
                        ·
                      </span>
                    )}
                    {user.studyPlace?.trim() && (
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                        <AcademicCapIcon className="size-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                        <span className="truncate">{user.studyPlace}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Stats — métricas del perfil visualizado (`user`), no desde currentProfile */}
                <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-gray-600 lg:justify-start dark:text-gray-400">
                  <span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatNumber(user._count?.posts ?? 0)}
                    </span>{' '}
                    {t('publicaciones')}
                  </span>
                  <span className="hidden text-gray-300 sm:inline dark:text-gray-600" aria-hidden>
                    ·
                  </span>
                  <span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatNumber(user._count?.followers ?? 0)}
                    </span>{' '}
                    {t('seguidores')}
                  </span>
                  {friendshipInfo && (
                    <>
                      <span className="hidden text-gray-300 sm:inline dark:text-gray-600" aria-hidden>
                        ·
                      </span>
                      <Link href={`/${user.username}?tab=amigos`} className="hover:underline focus:underline focus:outline-none">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatNumber(friendshipInfo.friendCount)}
                        </span>{' '}
                        {t('amigos')}
                      </Link>
                    </>
                  )}
                </div>

                <ProfileSocialLinks
                  websiteUrl={user.websiteUrl}
                  facebookUrl={user.facebookUrl}
                  instagramUrl={user.instagramUrl}
                  twitterUrl={user.twitterUrl}
                  linkedinUrl={user.linkedinUrl}
                  githubUrl={user.githubUrl}
                  className="mt-1"
                />
              </div>

              {/* Action cluster — estilo cercano a PageDetailHeader: primaria amigos, mensaje secundaria, ⋯ */}
              <div className="mt-4 flex w-full max-w-full flex-wrap items-center justify-center gap-2 lg:mt-0 lg:mr-6 lg:w-auto lg:justify-end *:max-w-full">
                {customActions ? (
                  customActions
                ) : isOwnProfile ? (
                  <>
                    <ProfessionalProfileButton
                      username={user.username}
                      isOwnProfile
                      hasProfessionalProfile={professionalProfileExists}
                    />
                    <EditProfileButton user={user} />
                  </>
                ) : (
                  <>
                    <ProfessionalProfileButton
                      username={user.username}
                      isOwnProfile={false}
                      hasProfessionalProfile={professionalProfileExists}
                    />
                    {!isFriends && (
                      <FriendButton userId={user.userId} variant="default" size="md" />
                    )}
                    <ProfileFollowStub />
                    <MessageButton userId={user.userId} />
                    <ProfileActionsMenu userId={user.userId} isFriends={isFriends} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
