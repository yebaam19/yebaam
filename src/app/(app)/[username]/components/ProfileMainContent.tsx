import {
  ProfilePostsList,
  ProfileAboutFull,
  ProfileFriendsFull,
  ProfilePhotosFull,
  ProfileVideosFull,
} from '.';
import type { ProfileTab } from './ProfileTabs';

interface ProfileMainContentProps {
  activeTab: ProfileTab;
  username: string;
  displayName: string;
  isOwnProfile: boolean;
  bio?: string;
  location?: string;
  work?: string;
  education?: string;
  relationship?: string;
  joinDate: string;
  email?: string;
  phone?: string;
  website?: string;
  languages?: string[];
  interests?: string[];
  mockPhotos: any[];
  mockFriends: any[];
  mockVideos: any[];
}

/**
 * Main content area for profile page
 * Displays different content based on active tab
 */
export function ProfileMainContent({
  activeTab,
  username,
  displayName,
  isOwnProfile,
  bio,
  location,
  work,
  education,
  relationship,
  joinDate,
  email,
  phone,
  website,
  languages,
  interests,
  mockPhotos,
  mockFriends,
  mockVideos,
}: ProfileMainContentProps) {
  return (
    <div className="lg:col-span-2">
      {activeTab === 'posts' && (
        <ProfilePostsList
          username={username}
          displayName={displayName}
          isOwnProfile={isOwnProfile}
        />
      )}

      {activeTab === 'about' && (
        <ProfileAboutFull
          username={username}
          displayName={displayName}
          bio={bio}
          location={location}
          work={work}
          education={education}
          relationship={relationship}
          joinDate={joinDate}
          email={email}
          phone={phone}
          website={website}
          languages={languages}
          interests={interests}
        />
      )}

      {activeTab === 'friends' && (
        <ProfileFriendsFull
          username={username}
          friends={mockFriends}
          totalFriends={mockFriends.length}
          isOwnProfile={isOwnProfile}
        />
      )}

      {activeTab === 'photos' && (
        <ProfilePhotosFull
          username={username}
          photos={mockPhotos}
          totalPhotos={mockPhotos.length}
          isOwnProfile={isOwnProfile}
        />
      )}

      {activeTab === 'videos' && (
        <ProfileVideosFull
          username={username}
          videos={mockVideos}
          totalVideos={mockVideos.length}
          isOwnProfile={isOwnProfile}
        />
      )}
    </div>
  );
}
