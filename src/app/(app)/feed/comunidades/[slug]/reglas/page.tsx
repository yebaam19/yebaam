import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { CommunityRulesPanel } from '@/features/communities/components/CommunityRulesPanel';

export default async function CommunityRulesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  return <CommunityRulesPanel community={community} />;
}
