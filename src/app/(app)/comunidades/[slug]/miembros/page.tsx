import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityMembers,
} from '@/features/communities/server/communities.server';
import { getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { CommunityMembersPanel } from '@/features/communities/components/CommunityMembersPanel';

export default async function CommunityMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const rawPage = (await searchParams)?.page;
  const requestedPage = rawPage && /^\d{1,4}$/.test(rawPage) ? Number(rawPage) : 1;
  const page = requestedPage >= 1 && requestedPage <= 1000 ? requestedPage : 1;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const capabilities = await getCommunityProfileCapabilities(community.id);
  if (!capabilities.moderation) {
    return <CommunityMembersPanel members={[]} total={community.stats.membersCount} restricted />;
  }
  const visiblePage = Math.min(page, Math.max(1, Math.ceil(community.stats.membersCount / 60)));
  const { members, total } = await getCommunityMembers(community.id, { page: visiblePage, limit: 60 });

  return <CommunityMembersPanel members={members} total={total} page={visiblePage} pageSize={60} slug={slug} />;
}
