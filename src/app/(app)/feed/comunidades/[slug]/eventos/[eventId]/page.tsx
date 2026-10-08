import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { getCommunityEvent, getEventAttendance } from '@/features/communities/server/community-events.server';
import { EventDetail } from '@/features/communities/components/events/EventDetail';
export default async function Page({ params }: { params: Promise<{ slug: string; eventId: string }> }) {
  const { slug, eventId } = await params; if (!z.uuid().safeParse(eventId).success) notFound();
  const community = await getCommunityBySlug(slug); if (!community) notFound();
  const event = await getCommunityEvent(community.id, eventId); if (!event) notFound();
  const [capabilities, attendance] = await Promise.all([getCommunityProfileCapabilities(community.id), getEventAttendance(eventId)]);
  return <EventDetail event={event} slug={slug} canManage={capabilities.settings} attendance={attendance} initialNow={new Date().toISOString()} />;
}
