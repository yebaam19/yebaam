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
  getClubForoBoard,
} from '@/features/clubs/server/clubs.server';
import { ensureClubPublicChat } from '@/lib/api/clubs';
import { getServerClient } from '@/utils/supabase/server';
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

  // Self-heal legacy clubs that predate auto-provisioning: if the owner is
  // viewing and the public chat row doesn't exist yet, create it now so the
  // "Chat público" panel renders correctly.
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth?.user?.id === club.ownerId) {
    await ensureClubPublicChat({
      id: club.id,
      name: club.name,
      owner_id: club.ownerId,
    }).catch((err) => {
      console.error('[ClubDetailPage] ensureClubPublicChat failed', err);
    });
  }

  const [
    posts,
    highlights,
    badges,
    members,
    events,
    promotions,
    publicChatId,
    foroSpaceSlug,
    foroBoard,
  ] = await Promise.all([
    getClubPosts(club.id, { limit: 24 }),
    getClubHighlights(club.id),
    getClubBadges(club.id),
    getClubMembers(club.id, { limit: 30 }),
    getClubEvents(club.id),
    getClubPromotions(club.id),
    getClubPublicChatId(club.id),
    getClubForoSpaceSlug(club.id),
    getClubForoBoard(club.id),
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
      foroBoard={foroBoard}
    />
  );
}
