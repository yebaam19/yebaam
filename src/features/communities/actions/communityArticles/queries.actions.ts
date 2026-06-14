'use server';

import { getServerClient } from '@/utils/supabase/server';
import { imageUrl } from '@/lib/media/urls';
import type { CommunityArticlePreview } from './types';

/**
 * Lightweight metadata fetch used by `PostArticleLinkPreview` to render a rich
 * card when a global-feed post body contains a community article URL. RLS on
 * `community_articles` already restricts visibility to community members, so
 * non-members will simply get null and we fall back to the plain link.
 */
export async function getCommunityArticlePreview(
  communitySlug: string,
  articleSlug: string,
): Promise<CommunityArticlePreview | null> {
  if (!communitySlug || !articleSlug) return null;

  const client = await getServerClient();
  const { data: community } = await client
    .from('communities')
    .select('id, name')
    .eq('slug', communitySlug)
    .maybeSingle();
  const communityRow = community as { id: string; name: string } | null;
  if (!communityRow) return null;

  const { data: article } = await client
    .from('community_articles')
    .select('slug, title, subtitle, summary, cf_image_id, read_time')
    .eq('community_id', communityRow.id)
    .eq('slug', articleSlug)
    .maybeSingle();
  const articleRow = article as
    | {
        slug: string;
        title: string;
        subtitle: string | null;
        summary: string | null;
        cf_image_id: string | null;
        read_time: number | null;
      }
    | null;
  if (!articleRow) return null;

  let coverImageUrl: string | null = null;
  if (articleRow.cf_image_id) {
    try {
      coverImageUrl = imageUrl(articleRow.cf_image_id, 'public');
    } catch {
      coverImageUrl = null;
    }
  }

  return {
    communitySlug,
    communityName: communityRow.name,
    articleSlug: articleRow.slug,
    title: articleRow.title,
    subtitle: articleRow.subtitle,
    summary: articleRow.summary,
    coverImageUrl,
    readTime: articleRow.read_time,
    href: `/feed/comunidades/${communitySlug}/articulos/${articleRow.slug}`,
  };
}
