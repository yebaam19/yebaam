import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { CommunityChatPanel } from '@/features/communities/components/CommunityChatPanel';

export default async function CommunityChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const viewerState = await getViewerJoinState(community.id);

  return <CommunityChatPanel community={community} viewerState={viewerState} />;
}
