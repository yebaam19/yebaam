import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { getCommunityEvent } from '@/features/communities/server/community-events.server';
import { EventForm } from '@/features/communities/components/events/EventForm';
import { EventUnavailable } from '@/features/communities/components/events/EventUnavailable';
export default async function Page({ params }: { params: Promise<{ slug: string; eventId: string }> }) {
  const { slug, eventId } = await params; if (!z.uuid().safeParse(eventId).success) return <EventUnavailable />;
  const community = await getCommunityBySlug(slug); if (!community) return <EventUnavailable />;
  const capabilities = await getCommunityProfileCapabilities(community.id);
  if (!capabilities.settings) { const t = await getTranslations('communities.events'); return <p role="alert">{t('forbidden')}</p>; }
  const event = await getCommunityEvent(community.id, eventId); if (!event) return <EventUnavailable />;
  return <EventForm communityId={community.id} slug={slug} organizer={community.name} initial={event} />;
}
