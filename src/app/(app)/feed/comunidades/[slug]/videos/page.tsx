import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityPosts,
} from '@/features/communities/server/communities.server';
import { CommunityTopTabs } from '@/features/communities/components/CommunityTopTabs';
import { CommunityVideosPanel } from '@/features/communities/components/CommunityVideosPanel';

export default async function CommunityVideosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const { posts } = await getCommunityPosts(community.id, { page: 1, limit: 50 });

  return (
    <div className="space-y-5">
      <CommunityTopTabs slug={slug} />
      <CommunityVideosPanel posts={posts} />
    </div>
  );
}
