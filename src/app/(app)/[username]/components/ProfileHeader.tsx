'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CameraIcon,
  PencilIcon,
  SparklesIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  ClockIcon,
  CheckIcon,
} from '@/components/icons/heroicons-shim';
import { CheckBadgeIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import EditProfileModal from './EditProfileModal';

type EditTab = 'general' | 'work-education' | 'contact' | 'interests';
const VALID_EDIT_TABS: readonly EditTab[] = ['general', 'work-education', 'contact', 'interests'];

type FriendshipStatus = 'none' | 'pending' | 'friends';

export type { FriendshipStatus };

interface ProfileHeaderProps {
  username: string;
  displayName: string;
  isVerified?: boolean;
  coverPhoto?: string | null;
  profilePhoto?: string | null;
  friendsCount: number;
  mutualFriendsCount: number;
  isOwnProfile: boolean;
  bio?: string;
  location?: string;
  work?: string;
  education?: string;
  relationship?: string;
  onProfileUpdate?: (updatedProfile: any) => void;
  friendshipStatus?: FriendshipStatus;
  onFriendshipChange?: (status: FriendshipStatus) => void;
}

export default function ProfileHeader({
  username,
  displayName,
  isVerified = false,
  coverPhoto,
  profilePhoto,
  friendsCount,
  mutualFriendsCount,
  isOwnProfile,
  bio,
  location,
  work,
  education,
  relationship,
  onProfileUpdate,
  friendshipStatus = 'none',
  onFriendshipChange,
}: ProfileHeaderProps) {
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [initialEditTab, setInitialEditTab] = useState<EditTab | undefined>(undefined);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Deep-link: ?edit=profile (optionally &tab=interests|general|...) auto-opens
  // the edit modal on the requested tab. Used by /feed/friends "Tu progreso"
  // steps so users land directly in the right form.
  useEffect(() => {
    if (!isOwnProfile) return;
    if (searchParams?.get('edit') !== 'profile') return;

    const requestedTab = searchParams.get('tab');
    const tab =
      requestedTab && (VALID_EDIT_TABS as readonly string[]).includes(requestedTab)
        ? (requestedTab as EditTab)
        : 'general';

    setInitialEditTab(tab);
    setIsEditModalOpen(true);

    // Strip the deeplink params so refreshes/back navigation don't re-open it.
    if (pathname) {
      router.replace(pathname as any, { scroll: false });
    }
  }, [isOwnProfile, pathname, router, searchParams]);

  const handleSaveProfile = (updatedProfile: any) => {
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
    // TODO: Integrar con el backend
    console.log('Profile updated:', updatedProfile);
  };

  const handleAddFriend = () => {
    onFriendshipChange?.('pending');
    // TODO: Llamar al backend para enviar solicitud
  };

  const handleCancelRequest = () => {
    onFriendshipChange?.('none');
    // TODO: Llamar al backend para cancelar solicitud
  };

  const handleRemoveFriend = () => {
    onFriendshipChange?.('none');
    // TODO: Llamar al backend para eliminar amigo
  };

  const handleMessage = () => {
    // TODO: Abrir chat con el usuario
    console.log('Open chat with', username);
  };

  return (
    <div className="relative bg-white dark:bg-neutral-900">
      {/* Cover Photo Section */}
      <div 
        className="relative h-[350px] overflow-hidden group"
        onMouseEnter={() => setIsHoveringCover(true)}
        onMouseLeave={() => setIsHoveringCover(false)}
      >
        {/* Cover Image */}
        {coverPhoto ? (
          <div className="relative w-full h-full">
            <img
              src={coverPhoto}
              alt="Cover"
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
              style={{
                minHeight: '100%',
                minWidth: '100%',
              }}
            />
            {/* Overlay para mejorar contraste con botones */}
            <div className="absolute inset-0 bg-black/5" />
          </div>
        ) : (
          <div className="w-full h-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
            {/* Patrón decorativo animado */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-2xl" />
            </div>
          </div>
        )}
        
        {/* Gradient overlay para mejor legibilidad */}
        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/40" />
        
        {/* Edit Cover Button */}
        {isOwnProfile && (
          <button
            className={`
              absolute top-6 right-6
              flex items-center gap-2.5 px-6 py-3
              bg-white/10 dark:bg-black/20
              backdrop-blur-xl
              border border-white/30
              rounded-2xl font-semibold text-white text-sm
              shadow-2xl
              hover:bg-white/20 dark:hover:bg-black/30
              hover:scale-105
              transform transition-all duration-300
              ${isHoveringCover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
            `}
          >
            <CameraIcon className="w-5 h-5" />
            Editar portada
          </button>
        )}
      </div>

      {/* Profile Info Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Avatar + Info Section */}
        <div className="relative -mt-24 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <div 
              className="relative group/avatar shrink-0"
              onMouseEnter={() => setIsHoveringAvatar(true)}
              onMouseLeave={() => setIsHoveringAvatar(false)}
            >
              {/* Avatar with ring effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-40 group-hover/avatar:opacity-60 transition-opacity" />
                <div className="relative w-44 h-44 rounded-full border-[6px] border-white dark:border-neutral-900 shadow-2xl overflow-hidden bg-white dark:bg-neutral-800">
                  <Avatar
                    className="w-full h-full transform group-hover/avatar:scale-110 transition-transform duration-500"
                    src={profilePhoto}
                    initials={displayName.slice(0, 2).toUpperCase()}
                  />
                </div>
              </div>
              
              {/* Edit Avatar Button */}
              {isOwnProfile && (
                <button
                  className={`
                    absolute bottom-2 right-2
                    w-12 h-12
                    bg-white dark:bg-neutral-800
                    border-2 border-neutral-100 dark:border-neutral-700
                    rounded-full
                    flex items-center justify-center
                    shadow-xl
                    hover:bg-primary-50 dark:hover:bg-primary-900
                    hover:border-primary-200 dark:hover:border-primary-700
                    hover:scale-110
                    transform transition-all duration-300
                    ${isHoveringAvatar ? 'opacity-100 rotate-0' : 'opacity-0 rotate-45'}
                  `}
                >
                  <CameraIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </button>
              )}
              
              {/* Online indicator si es tu perfil */}
              {isOwnProfile && (
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-green-500 border-4 border-white dark:border-neutral-900 rounded-full shadow-lg" />
              )}
            </div>

            {/* Name + Stats + Actions */}
            <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 pb-2">
              {/* Name + Username */}
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start mb-1">
                  <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    {displayName}
                  </h1>
                  {isVerified && (
                    <div className="relative group/badge">
                      <CheckBadgeIcon className="w-9 h-9 text-blue-500 drop-shadow-lg group-hover/badge:scale-110 transition-transform" />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium rounded-lg opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Cuenta verificada
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-lg font-medium mb-3">
                  @{username}
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="font-bold text-xl text-neutral-900 dark:text-white">
                      {friendsCount.toLocaleString()}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400 ml-1.5">
                      amigos
                    </span>
                  </div>
                  {mutualFriendsCount > 0 && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-neutral-400" />
                      <div>
                        <span className="font-bold text-lg text-neutral-900 dark:text-white">
                          {mutualFriendsCount}
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400 ml-1.5">
                          en común
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {isOwnProfile ? (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="group flex items-center gap-2.5 px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <PencilIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Editar perfil
                  </button>
                ) : (
                  <>
                    {/* Botón de Amistad */}
                    {friendshipStatus === 'none' && (
                      <button 
                        onClick={handleAddFriend}
                        className="group flex items-center gap-2.5 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <UserPlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Agregar amigo
                      </button>
                    )}
                    
                    {friendshipStatus === 'pending' && (
                      <button 
                        onClick={handleCancelRequest}
                        className="group flex items-center gap-2.5 px-6 py-3.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 hover:scale-105 transform transition-all duration-300 shadow-lg"
                      >
                        <ClockIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Solicitud enviada
                      </button>
                    )}
                    
                    {friendshipStatus === 'friends' && (
                      <button 
                        onClick={handleRemoveFriend}
                        className="group flex items-center gap-2.5 px-6 py-3.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:scale-105 transform transition-all duration-300 shadow-lg"
                      >
                        <CheckIcon className="w-5 h-5" />
                        <span className="group-hover:hidden">Amigos</span>
                        <span className="hidden group-hover:flex items-center gap-1.5">
                          <UserMinusIcon className="w-5 h-5" />
                          Eliminar
                        </span>
                      </button>
                    )}

                    {/* Botón de Mensaje */}
                    <button 
                      onClick={handleMessage}
                      className="group flex items-center gap-2.5 px-6 py-3.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 hover:scale-105 transform transition-all duration-300 shadow-lg"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Mensaje
                    </button>

                    {/* Botón de Más opciones */}
                    <button className="group flex items-center justify-center w-12 h-12 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 hover:scale-105 transform transition-all duration-300 shadow-lg">
                      <EllipsisHorizontalIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialTab={initialEditTab}
          currentProfile={{
            username,
            displayName,
            bio,
            location,
            work,
            education,
            relationship,
            coverPhoto,
            profilePhoto,
          }}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
