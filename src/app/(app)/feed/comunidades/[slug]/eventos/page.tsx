import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { getCommunityEvents } from '@/features/communities/server/community-events.server';
import { eventMonthSchema } from '@/features/communities/schemas/communityEvent.schema';
import { eventMonth } from '@/features/communities/lib/event-dates';
import { EventsIndex } from '@/features/communities/components/events/EventsIndex';
export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const community = await getCommunityBySlug(slug); if (!community) notFound();
  const now = new Date().toISOString();
  const month = eventMonthSchema.safeParse(query.month).success ? query.month! : eventMonth(now);
  const [page, capabilities] = await Promise.all([getCommunityEvents(community.id, month), getCommunityProfileCapabilities(community.id)]);
  return <EventsIndex key={month} communityId={community.id} slug={slug} month={month} initial={page}
    canManage={capabilities.settings} initialNow={now} initialView={query.view === 'calendar' ? 'calendar' : 'list'} />;
}
