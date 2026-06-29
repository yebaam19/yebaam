'use client';

import CreatePostCard from '@/components/CreatePostCard/CreatePostCard';
import {
  AboutMe,
  ProfileSidebar,
  UserFamilies,
  UserFriends,
  UserPets,
  UserPhotos,
  UserPosts,
  UserVideos,
} from '@/features/profile/components';
import type { UserProfile } from '@/features/profile/interfaces/profile.interfaces';
import { Suspense } from 'react';
import type { TabType } from './ProfileTabsNav';

interface ProfileTabPanelsProps {
  user: UserProfile;
  loggedInUserId: string;
  isOwnProfile: boolean;
  hasCurrentUser: boolean;
  activeTab: TabType;
  onCreatePost: () => void;
}

export default function ProfileTabPanels({
  user,
  loggedInUserId,
  isOwnProfile,
  hasCurrentUser,
  activeTab,
  onCreatePost,
}: ProfileTabPanelsProps) {
  return (
    <div className="mx-auto max-w-5xl min-w-0 p-3 sm:p-4">
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Main Content */}
        <div className="min-w-0 lg:col-span-3">
          <div className="mx-auto max-w-3xl min-w-0">
            {activeTab === 'publicaciones' && (
              <div className="space-y-6">
                {isOwnProfile && hasCurrentUser && (
                  <Suspense fallback={null}>
                    <CreatePostCard
                      user={{
                        avatar: user.avatarUrl || undefined,
                        username: user.username,
                      }}
                      onCreateClick={onCreatePost}
                    />
                  </Suspense>
                )}
                <Suspense
                  fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>}
                >
                  <UserPosts userId={user.userId} isOwnProfile={isOwnProfile} />
                </Suspense>
              </div>
            )}

            {activeTab === 'acerca-de' && <AboutMe user={user} loggedInUserId={loggedInUserId} />}

            {activeTab === 'amigos' && (
              <UserFriends userId={user.userId} isOwnProfile={isOwnProfile} />
            )}

            {activeTab === 'familias' && (
              <UserFamilies userId={user.userId} isOwnProfile={isOwnProfile} />
            )}

            {activeTab === 'mascotas' && (
              <Suspense
                fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>}
              >
                <UserPets userId={user.userId} ownerUsername={user.username} isOwnProfile={isOwnProfile} />
              </Suspense>
            )}

            {activeTab === 'fotos' && (
              <Suspense
                fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>}
              >
                <UserPhotos userId={user.userId} />
              </Suspense>
            )}

            {activeTab === 'videos' && (
              <Suspense
                fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>}
              >
                <UserVideos userId={user.userId} />
              </Suspense>
            )}

          </div>
        </div>

        {/* Sidebar - always visible */}
        <div className="min-w-0 lg:col-span-1">
          <div className="lg:sticky lg:top-[calc(7rem+env(safe-area-inset-top,0px))]">
            <ProfileSidebar user={user} loggedInUserId={loggedInUserId} />
          </div>
        </div>
      </div>
    </div>
  );
}
