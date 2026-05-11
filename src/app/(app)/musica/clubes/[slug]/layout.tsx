import { notFound } from 'next/navigation';
import {
  getMusicClubBySlug,
  getViewerJoinStatus,
} from '@/features/music-archive/server/clubs.server';
import { MusicClubHero } from '@/features/music-archive/components/club/MusicClubHero';
import { MusicClubTabs } from '@/features/music-archive/components/club/MusicClubTabs';
import { ClubMembershipBar } from '@/features/music-archive/components/club/ClubMembershipBar';

export default async function MusicClubLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const joinStatus = await getViewerJoinStatus(club.id);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <MusicClubHero club={club} />
      <ClubMembershipBar clubId={club.id} clubSlug={slug} initial={joinStatus} />
      <MusicClubTabs slug={slug} />
      <div>{children}</div>
    </div>
  );
}
