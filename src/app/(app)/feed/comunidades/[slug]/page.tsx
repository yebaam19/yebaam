import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityMembers,
  getCommunityPosts,
} from '@/features/communities/server/communities.server';
import { CommunityDetailClient } from '@/features/communities/components/CommunityDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [posts, members] = await Promise.all([
    getCommunityPosts(community.id, { page: 1, limit: 10 }),
    getCommunityMembers(community.id, { page: 1, limit: 20 }),
  ]);

  return (
    <CommunityDetailClient
      slug={slug}
      initialCommunity={community}
      initialPosts={posts}
      initialMembers={members}
    />
  );
}
