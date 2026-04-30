import { notFound, redirect } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { canPublishCommunityArticle } from '@/features/communities/server/community-articles.server';
import { CommunityArticleComposer } from '@/features/communities/components/CommunityArticleComposer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewCommunityArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const canPublish = await canPublishCommunityArticle(community.id);
  if (!canPublish) {
    redirect(`/feed/comunidades/${slug}/articulos`);
  }

  return (
    <CommunityArticleComposer
      communityId={community.id}
      communitySlug={slug}
    />
  );
}
