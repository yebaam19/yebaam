import { notFound } from 'next/navigation';

import {
  checkIsFollowing,
  getMyProfile,
  getProfileByUsername,
  hydrateOwnerExtras,
} from '../server/profile.server';
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

  if (isOwner) {
    const extras = await hydrateOwnerExtras(profile.id);
    if (profile.titles) {
      profile.titles = profile.titles.map((t) => ({
        ...t,
        diplomaCfImageId: extras.titleDiplomas.get(t.id) ?? null,
      }));
    }
    if (profile.studies) {
      profile.studies = profile.studies.map((s) => ({
        ...s,
        diplomaCfImageId: extras.studyDiplomas.get(s.id) ?? null,
      }));
    }
  }

  return (
    <ProfessionalProfileView
      profile={profile}
      isOwner={isOwner}
      initialIsFollowing={isFollowing}
    />
  );
}
