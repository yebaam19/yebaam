import { notFound } from 'next/navigation';

import { checkIsFollowing, getMyProfile, getProfileByUsername } from '../server/profile.server';
import { ProfessionalProfileView } from './ProfessionalProfileView';

interface ProfessionalProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfessionalProfilePage({ params }: ProfessionalProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [myProfile, isFollowing] = await Promise.all([
    getMyProfile(),
    checkIsFollowing(profile.id),
  ]);

  const isOwner = !!myProfile && myProfile.userId === profile.userId;

  return (
    <ProfessionalProfileView
      profile={profile}
      isOwner={isOwner}
      initialIsFollowing={isFollowing}
    />
  );
}
