import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityMembers,
} from '@/features/communities/server/communities.server';
import { CommunityMembersPanel } from '@/features/communities/components/CommunityMembersPanel';

export default async function CommunityMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const { members, total } = await getCommunityMembers(community.id, { page: 1, limit: 60 });

  return <CommunityMembersPanel members={members} total={total} />;
}
