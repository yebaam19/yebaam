import 'server-only';
import type { getServerClient } from '@/utils/supabase/server';
import { withImageVariant } from '@/lib/media/urls';

export type ReviewRow = {
  id: string;
  page_id: string;
  user_id: string;
  rating: number;
  comment: string;
  photos: unknown;
  helpful_count: number;
  owner_response: string | null;
  owner_responded_at: string | null;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolvePageId(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug;
  const { data } = await client
    .from('pages')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export function mapReview(
  row: ReviewRow,
  author: ProfileLite | undefined,
  helpfulByMe: boolean
) {
  return {
    id: row.id,
    pageId: row.page_id,
    userId: row.user_id,
    user: {
      id: row.user_id,
      username: author?.username ?? '',
      fullName:
        [author?.first_name, author?.last_name].filter(Boolean).join(' ') ||
        author?.username ||
        '',
      profilePicture: author?.avatar_url ? withImageVariant(author.avatar_url, 'avatar') : null,
      isVerified: false,
    },
    rating: row.rating,
    comment: row.comment ?? '',
    photos: Array.isArray(row.photos) ? row.photos : [],
    helpfulCount: row.helpful_count ?? 0,
    isHelpfulByCurrentUser: helpfulByMe,
    ownerResponse: row.owner_response,
    ownerRespondedAt: row.owner_responded_at,
    isEdited: row.is_edited,
    editedAt: row.edited_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function refreshHelpfulCount(
  client: Awaited<ReturnType<typeof getServerClient>>,
  reviewId: string
) {
  const { count } = await client
    .from('page_review_helpful')
    .select('review_id', { count: 'exact', head: true })
    .eq('review_id', reviewId);
  await client
    .from('page_reviews')
    .update({ helpful_count: count ?? 0 })
    .eq('id', reviewId);
}
