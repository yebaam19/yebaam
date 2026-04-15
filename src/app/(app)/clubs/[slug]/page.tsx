import { notFound } from 'next/navigation';
import {
  getClubBySlug,
  getClubPosts,
  getClubHighlights,
  getClubBadges,
  getClubMembers,
  getClubEvents,
  getClubPromotions,
  getClubPublicChatId,
  getClubForoSpaceSlug,
} from '@/features/clubs/server/clubs.server';
import { ClubDetailView } from '@/features/clubs/components/club-detail/ClubDetailView';

export const dynamic = 'force-dynamic';

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) notFound();

  const [posts, highlights, badges, members, events, promotions, publicChatId, foroSpaceSlug] =
    await Promise.all([
      getClubPosts(club.id, { limit: 24 }),
      getClubHighlights(club.id),
      getClubBadges(club.id),
      getClubMembers(club.id, { limit: 30 }),
      getClubEvents(club.id),
      getClubPromotions(club.id),
      getClubPublicChatId(club.id),
      getClubForoSpaceSlug(club.id),
    ]);

  return (
    <ClubDetailView
      club={club}
      initialPosts={posts}
      highlights={highlights}
      badges={badges}
      members={members}
      events={events}
      promotions={promotions}
      publicChatId={publicChatId}
      foroSpaceSlug={foroSpaceSlug}
    />
  );
}
