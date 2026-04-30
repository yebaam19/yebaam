import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityPosts,
} from '@/features/communities/server/communities.server';
import { CommunityTopTabs } from '@/features/communities/components/CommunityTopTabs';
import { CommunityPhotosPanel } from '@/features/communities/components/CommunityPhotosPanel';

export default async function CommunityPhotosPage({
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
      <CommunityPhotosPanel posts={posts} />
    </div>
  );
}
