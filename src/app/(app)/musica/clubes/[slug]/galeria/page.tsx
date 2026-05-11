import { notFound } from 'next/navigation';
import {
  getMusicClubBySlug,
  getViewerJoinStatus,
} from '@/features/music-archive/server/clubs.server';
import { listMusicMediaForClub } from '@/features/music-archive/server/music-media.server';
import { ClubGallerySection } from '@/features/music-archive/components/media/ClubGallerySection';

export default async function ClubGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [media, joinStatus] = await Promise.all([
    listMusicMediaForClub(club.id, 60),
    getViewerJoinStatus(club.id),
  ]);
  const canUpload = joinStatus.kind === 'approved';

  return (
    <ClubGallerySection
      clubId={club.id}
      clubName={club.name}
      canUpload={canUpload}
      items={media}
    />
  );
}
