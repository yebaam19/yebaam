import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { EventForm } from '@/features/communities/components/events/EventForm';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const community = await getCommunityBySlug(slug); if (!community) notFound();
  const capabilities = await getCommunityProfileCapabilities(community.id);
  if (!capabilities.settings) { const t = await getTranslations('communities.events'); return <p role="alert">{t('forbidden')}</p>; }
  return <EventForm communityId={community.id} slug={slug} organizer={community.name} initial={null} />;
}
