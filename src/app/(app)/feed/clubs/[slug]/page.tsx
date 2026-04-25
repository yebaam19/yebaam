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
import { ensureClubChatMembership } from '@/lib/api/clubs';
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

  // Self-heal: for any authenticated club member (including the owner)
  // viewing the page, make sure the public-chat conversation exists and that
  // the viewer has a participant row — otherwise RLS hides the conversation
  // and the "Chat público" panel falls back to "no habilitado".
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth?.user?.id) {
    await ensureClubChatMembership(club.id, auth.user.id).catch((err) => {
      console.error('[ClubDetailPage] ensureClubChatMembership failed', err);
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
