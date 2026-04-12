import {
  ProfileAbout,
  ProfilePhotosGrid,
  ProfileFriendsGrid,
} from '.';
import type { ProfileTab } from './ProfileTabs';

interface ProfileSidebarProps {
  activeTab: ProfileTab;
  username: string;
  bio?: string;
  location?: string;
  work?: string;
  education?: string;
  relationship?: string;
  joinDate: string;
  mutualFriendsCount?: number;
  isOwnProfile: boolean;
  friendsCount: number;
  mockPhotos: any[];
  mockFriends: any[];
}

/**
 * Sidebar component for profile page
 * Shows About, Photos, and Friends sections
 */
export function ProfileSidebar({
  activeTab,
  username,
  bio,
  location,
  work,
  education,
  relationship,
  joinDate,
  mutualFriendsCount,
  isOwnProfile,
  friendsCount,
  mockPhotos,
  mockFriends,
}: ProfileSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-4">
      {/* Información */}
      {(activeTab === 'posts' || activeTab === 'about') && (
        <ProfileAbout
          bio={bio}
          location={location}
          work={work}
          education={education}
          relationship={relationship}
          joinDate={joinDate}
          mutualFriendsCount={isOwnProfile ? undefined : mutualFriendsCount}
        />
      )}

      {/* Fotos */}
      {(activeTab === 'posts' || activeTab === 'photos') && (
        <ProfilePhotosGrid
          username={username}
          photos={mockPhotos.slice(0, 9)}
          totalPhotos={mockPhotos.length}
        />
      )}

      {/* Amigos */}
      {(activeTab === 'posts' || activeTab === 'friends') && (
        <ProfileFriendsGrid
          username={username}
          friends={mockFriends}
          totalFriends={friendsCount}
        />
      )}
    </div>
  );
}
