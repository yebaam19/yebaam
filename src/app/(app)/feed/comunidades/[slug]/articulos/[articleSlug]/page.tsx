import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import {
  canManageCommunityArticle,
  getCommunityArticleBySlug,
} from '@/features/communities/server/community-articles.server';
import { CommunityArticleView } from '@/features/communities/components/CommunityArticleView';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';

interface PageProps {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export default async function CommunityArticleDetailPage({ params }: PageProps) {
  const { slug, articleSlug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [article, canManage, viewer] = await Promise.all([
    getCommunityArticleBySlug(community.id, articleSlug),
    canManageCommunityArticle(community.id),
    getCachedAuthUser(),
  ]);
  if (!article) notFound();

  const isAuthor = Boolean(viewer && viewer.id === article.author.id);

  return (
    <CommunityArticleView
      communitySlug={slug}
      article={article}
      canManage={canManage}
      isAuthor={isAuthor}
    />
  );
}
