import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import {
  canManageCommunityArticle,
  getCommunityArticleBySlug,
} from '@/features/communities/server/community-articles.server';
import { CommunityArticleView } from '@/features/communities/components/CommunityArticleView';

interface PageProps {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export default async function CommunityArticleDetailPage({ params }: PageProps) {
  const { slug, articleSlug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [article, canManage] = await Promise.all([
    getCommunityArticleBySlug(community.id, articleSlug),
    canManageCommunityArticle(community.id),
  ]);
  if (!article) notFound();

  return <CommunityArticleView communitySlug={slug} article={article} canManage={canManage} />;
}
