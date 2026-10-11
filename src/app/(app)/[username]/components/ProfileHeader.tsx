'use client';

import { usePathname,useRouter,useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Route } from 'next';
import EditProfileModal, { type ProfileUpdate } from './EditProfileModal';
import ProfileActions from './ProfileHeader/ProfileActions';
import ProfileAvatar from './ProfileHeader/ProfileAvatar';
import ProfileCover from './ProfileHeader/ProfileCover';
import ProfileIdentity from './ProfileHeader/ProfileIdentity';

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
  onProfileUpdate?: (updatedProfile: ProfileUpdate) => void;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [initialEditTab, setInitialEditTab] = useState<EditTab>();
  const [handledRequest, setHandledRequest] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const editRequested = isOwnProfile && searchParams?.get('edit') === 'profile';
  const requestedTab = searchParams?.get('tab');
  const deepLinkTab = requestedTab && (VALID_EDIT_TABS as readonly string[]).includes(requestedTab)
    ? requestedTab as EditTab : 'general';
  const editRequest = editRequested ? `${username}:${searchParams.toString()}` : null;
  if (editRequest !== handledRequest) {
    setHandledRequest(editRequest);
    if (editRequest) {
      setInitialEditTab(deepLinkTab);
      setIsEditModalOpen(true);
    }
  }

  // Consume the deep link after the form has captured its requested tab.
  useEffect(() => {
    if (!editRequested || !pathname) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('edit');
    nextParams.delete('tab');
    router.replace(`${pathname}${nextParams.size ? `?${nextParams}` : ''}` as Route, { scroll: false });
  }, [editRequested, pathname, router, searchParams]);

  const handleSaveProfile = (updatedProfile: ProfileUpdate) => {
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
      <ProfileCover coverPhoto={coverPhoto} isOwnProfile={isOwnProfile} />

      {/* Profile Info Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Avatar + Info Section */}
        <div className="relative -mt-24 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <ProfileAvatar
              displayName={displayName}
              profilePhoto={profilePhoto}
              isOwnProfile={isOwnProfile}
            />

            {/* Name + Stats + Actions */}
            <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 pb-2">
              {/* Name + Username */}
              <ProfileIdentity
                username={username}
                displayName={displayName}
                isVerified={isVerified}
                friendsCount={friendsCount}
                mutualFriendsCount={mutualFriendsCount}
              />

              {/* Action Buttons */}
              <ProfileActions
                isOwnProfile={isOwnProfile}
                friendshipStatus={friendshipStatus}
                onEditProfile={() => setIsEditModalOpen(true)}
                onAddFriend={handleAddFriend}
                onCancelRequest={handleCancelRequest}
                onRemoveFriend={handleRemoveFriend}
                onMessage={handleMessage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && isEditModalOpen && (
        <EditProfileModal
          isOpen={true}
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
