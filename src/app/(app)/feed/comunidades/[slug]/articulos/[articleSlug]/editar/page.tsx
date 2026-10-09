import { redirect } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import {
  canManageCommunityArticle,
  getCommunityArticleAssets,
  getCommunityArticleForEdit,
} from '@/features/communities/server/community-articles.server';
import { CommunityArticleComposer } from '@/features/communities/components/CommunityArticleComposer';
import { CommunityContentUnavailable } from '@/features/communities/components/CommunityContentUnavailable';

interface PageProps {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export default async function EditCommunityArticlePage({ params }: PageProps) {
  const { slug, articleSlug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return <CommunityContentUnavailable kind="article" />;

  const canManage = await canManageCommunityArticle(community.id);
  if (!canManage) {
    redirect(`/feed/comunidades/${slug}/articulos/${articleSlug}`);
  }

  const article = await getCommunityArticleForEdit(community.id, articleSlug);
  if (!article) return <CommunityContentUnavailable kind="article" />;
  const attachments = await getCommunityArticleAssets(community.id, article.attachmentIds);

  return (
    <CommunityArticleComposer
      communityId={community.id}
      communitySlug={slug}
      initialArticle={article}
      initialAttachments={attachments}
    />
  );
}
