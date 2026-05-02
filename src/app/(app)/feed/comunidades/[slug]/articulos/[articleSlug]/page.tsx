import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import {
  canManageCommunityArticle,
  getCommunityArticleBySlug,
} from '@/features/communities/server/community-articles.server';
import { CommunityArticleView } from '@/features/communities/components/CommunityArticleView';
import { getServerClient } from '@/utils/supabase/server';

interface PageProps {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export default async function CommunityArticleDetailPage({ params }: PageProps) {
  const { slug, articleSlug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [article, canManage, viewerId] = await Promise.all([
    getCommunityArticleBySlug(community.id, articleSlug),
    canManageCommunityArticle(community.id),
    getServerClient().then(async (c) => (await c.auth.getUser()).data.user?.id ?? null),
  ]);
  if (!article) notFound();

  const isAuthor = Boolean(viewerId && viewerId === article.author.id);

  return (
    <CommunityArticleView
      communitySlug={slug}
      article={article}
      canManage={canManage}
      isAuthor={isAuthor}
    />
  );
}
