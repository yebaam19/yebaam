import { notFound, redirect } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import {
  canManageCommunityArticle,
  getCommunityArticleForEdit,
} from '@/features/communities/server/community-articles.server';
import { CommunityArticleComposer } from '@/features/communities/components/CommunityArticleComposer';

interface PageProps {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export default async function EditCommunityArticlePage({ params }: PageProps) {
  const { slug, articleSlug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const canManage = await canManageCommunityArticle(community.id);
  if (!canManage) {
    redirect(`/feed/comunidades/${slug}/articulos/${articleSlug}`);
  }

  const data = await getCommunityArticleForEdit(community.id, articleSlug);
  if (!data) notFound();

  return (
    <CommunityArticleComposer
      communityId={community.id}
      communitySlug={slug}
      initialArticle={data.article}
      initialCoverImageId={data.cfImageId}
    />
  );
}
