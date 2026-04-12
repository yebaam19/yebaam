/**
 * Profile Page Skeleton Component
 *
 * Skeleton de alta fidelidad para la página completa del perfil de usuario
 * Replica exactamente la estructura visual de /[username]/page
 */

import { PostCardSkeleton } from './PostCardSkeleton';
import { ProfileSidebarSkeleton } from './ProfileSidebarSkeleton';
import { ProfileTabsSkeleton } from './ProfileTabsSkeleton';
import { UserDetailsSkeleton } from './UserDetailsSkeleton';
import { UserProfileSkeleton } from './UserProfileSkeleton';

export function ProfilePageSkeleton() {
  return (
    <>
      {/* Header with cover and avatar */}
      <UserProfileSkeleton />

      {/* Tabs Navigation */}
      <ProfileTabsSkeleton />

      {/* Content Area with Sidebar Layout */}
      <div className="mx-auto max-w-5xl p-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Posts */}
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* About Card */}
              <UserDetailsSkeleton />

              {/* Sidebar Navigation */}
              <ProfileSidebarSkeleton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
