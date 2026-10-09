import { z } from 'zod';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { getCommunityEvent, getEventAttendance } from '@/features/communities/server/community-events.server';
import { EventDetail } from '@/features/communities/components/events/EventDetail';
import { EventUnavailable } from '@/features/communities/components/events/EventUnavailable';
export default async function Page({ params }: { params: Promise<{ slug: string; eventId: string }> }) {
  const { slug, eventId } = await params; if (!z.uuid().safeParse(eventId).success) return <EventUnavailable />;
  const community = await getCommunityBySlug(slug); if (!community) return <EventUnavailable />;
  const event = await getCommunityEvent(community.id, eventId); if (!event) return <EventUnavailable />;
  const [capabilities, attendance] = await Promise.all([getCommunityProfileCapabilities(community.id), getEventAttendance(eventId)]);
  return <EventDetail event={event} slug={slug} canManage={capabilities.settings} attendance={attendance} initialNow={new Date().toISOString()} />;
}
