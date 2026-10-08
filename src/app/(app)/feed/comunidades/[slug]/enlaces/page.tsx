import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { getCommunityRelatedLinks } from '@/features/communities/server/community-related-links.server';
import { RelatedLinksWorkspace } from '@/features/communities/components/related-links/RelatedLinksWorkspace';

export default async function CommunityLinksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();
  const [capabilities, links] = await Promise.all([
    getCommunityProfileCapabilities(community.id), getCommunityRelatedLinks(community.id),
  ]);
  return <RelatedLinksWorkspace communityId={community.id} slug={community.slug}
    website={community.website ?? null} canManage={capabilities.settings} initial={links} />;
}
