'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EditProfileModal from './EditProfileModal';
import ProfileCover from './ProfileHeader/ProfileCover';
import ProfileAvatar from './ProfileHeader/ProfileAvatar';
import ProfileIdentity from './ProfileHeader/ProfileIdentity';
import ProfileActions from './ProfileHeader/ProfileActions';

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
