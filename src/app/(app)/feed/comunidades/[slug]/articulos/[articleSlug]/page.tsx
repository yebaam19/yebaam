import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import {
  canManageCommunityArticle,
  getCommunityArticleAssets,
  getCommunityArticleBySlug,
} from '@/features/communities/server/community-articles.server';
import { CommunityArticleView } from '@/features/communities/components/CommunityArticleView';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { CommunityContentUnavailable } from '@/features/communities/components/CommunityContentUnavailable';

interface PageProps {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export default async function CommunityArticleDetailPage({ params }: PageProps) {
  const { slug, articleSlug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return <CommunityContentUnavailable kind="article" />;

  const [article, canManage, viewer] = await Promise.all([
    getCommunityArticleBySlug(community.id, articleSlug),
    canManageCommunityArticle(community.id),
    getCachedAuthUser(),
  ]);
  if (!article) return <CommunityContentUnavailable kind="article" />;
  const assets = await getCommunityArticleAssets(community.id, [...article.embeddedAssetIds, ...article.attachmentIds]);

  const isAuthor = Boolean(viewer && viewer.id === article.author.id);

  return (
    <CommunityArticleView
      communitySlug={slug}
      article={article}
      assets={assets}
      canManage={canManage}
      isAuthor={isAuthor}
    />
  );
}
