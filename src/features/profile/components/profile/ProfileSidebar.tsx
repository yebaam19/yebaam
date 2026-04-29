'use client';

import type { UserProfile } from '../../interfaces/profile.interfaces';
import UserDetails from './UserDetails';
import ProfilePhotosPreview from './ProfilePhotosPreview';
import ProfileFriendsPreview from './ProfileFriendsPreview';
import ProfileInfoCard from './ProfileInfoCard';
import ProfileMoreLinksCard from './ProfileMoreLinksCard';

interface ProfileSidebarProps {
  user: UserProfile;
  loggedInUserId: string;
}

export default function ProfileSidebar({ user, loggedInUserId }: ProfileSidebarProps) {
  return (
    <div className="space-y-4">
      <UserDetails user={user} loggedInUserId={loggedInUserId} />
      <ProfilePhotosPreview userId={user.userId} username={user.username} />
      <ProfileFriendsPreview userId={user.userId} username={user.username} />
      <ProfileInfoCard user={user} loggedInUserId={loggedInUserId} />
      <ProfileMoreLinksCard user={user} />
    </div>
  );
}
