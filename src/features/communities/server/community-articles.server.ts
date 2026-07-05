import 'server-only';

import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { imageUrl } from '@/lib/media/urls';
import type {
  CommunityArticle,
  CommunityArticleAuthor,
  CommunityArticleSummary,
} from '../types/communityArticle.types';

type ArticleRow = {
  id: string;
  community_id: string;
  author_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  summary: string | null;
  cf_image_id: string | null;
  read_time: number | null;
  tags: string[] | null;
  published_at: string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

const COLUMNS =
  'id, community_id, author_id, slug, title, subtitle, content, summary, cf_image_id, read_time, tags, published_at, created_at, updated_at';

const SUMMARY_COLUMNS =
  'id, community_id, author_id, slug, title, subtitle, summary, cf_image_id, read_time, tags, published_at, created_at, updated_at';

function toAuthor(row: ProfileRow | undefined): CommunityArticleAuthor {
  if (!row) {
    return { id: '', username: 'usuario', name: 'Usuario', avatar: null };
  }
  const name =
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
    row.username ||
    'Usuario';
  return {
    id: row.id,
    username: row.username ?? 'usuario',
    name,
    avatar: row.avatar_url,
  };
}

function toCoverUrl(cfImageId: string | null): string | null {
  if (!cfImageId) return null;
  try {
    return imageUrl(cfImageId, 'public');
  } catch {
    return null;
  }
}

function toSummary(row: Omit<ArticleRow, 'content'>, author: CommunityArticleAuthor): CommunityArticleSummary {
  return {
    id: row.id,
    communityId: row.community_id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    summary: row.summary,
    coverImageUrl: toCoverUrl(row.cf_image_id),
    readTime: row.read_time,
    tags: row.tags ?? [],
    publishedAt: row.published_at,
    author,
  };
}

function toArticle(row: ArticleRow, author: CommunityArticleAuthor): CommunityArticle {
  return {
    ...toSummary(row, author),
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadAuthors(ids: string[]): Promise<Map<string, CommunityArticleAuthor>> {
  const map = new Map<string, CommunityArticleAuthor>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;
  const client = await getServerClient();
  const { data } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .in('id', unique);
  for (const row of (data ?? []) as ProfileRow[]) {
    map.set(row.id, toAuthor(row));
  }
  return map;
}

export async function listCommunityArticles(
  communityId: string,
  opts: { limit?: number } = {},
): Promise<CommunityArticleSummary[]> {
  const client = await getServerClient();
  const { data } = await client
    .from('community_articles')
    .select(SUMMARY_COLUMNS)
    .eq('community_id', communityId)
    .order('published_at', { ascending: false })
    .limit(opts.limit ?? 30);
  const rows = (data ?? []) as Omit<ArticleRow, 'content'>[];
  if (rows.length === 0) return [];
  const authors = await loadAuthors(rows.map((r) => r.author_id));
  return rows.map((r) =>
    toSummary(r, authors.get(r.author_id) ?? toAuthor(undefined)),
  );
}

export async function getCommunityArticleBySlug(
  communityId: string,
  slug: string,
): Promise<CommunityArticle | null> {
  if (!slug) return null;
  const client = await getServerClient();
  const { data } = await client
    .from('community_articles')
    .select(COLUMNS)
    .eq('community_id', communityId)
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  const row = data as ArticleRow;
  const authors = await loadAuthors([row.author_id]);
  return toArticle(row, authors.get(row.author_id) ?? toAuthor(undefined));
}

/**
 * Same as getCommunityArticleBySlug but also returns the raw cf_image_id, so the
 * edit page can preload the existing cover into the composer state.
 */
export async function getCommunityArticleForEdit(
  communityId: string,
  slug: string,
): Promise<{ article: CommunityArticle; cfImageId: string | null } | null> {
  const article = await getCommunityArticleBySlug(communityId, slug);
  if (!article) return null;
  const client = await getServerClient();
  const { data } = await client
    .from('community_articles')
    .select('cf_image_id')
    .eq('id', article.id)
    .maybeSingle();
  return { article, cfImageId: (data as { cf_image_id: string | null } | null)?.cf_image_id ?? null };
}

/**
 * Returns true when the viewer is the community owner or holds the OWNER/ADMIN
 * role on community_members. Used by both the create page (to gate UI) and the
 * server action (defense in depth — RLS already blocks unauthorized inserts).
 */
export async function canPublishCommunityArticle(communityId: string): Promise<boolean> {
  const user = await getCachedAuthUser();
  const userId = user?.id;
  if (!userId) return false;

  const client = await getServerClient();

  const { data: c } = await client
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .maybeSingle();
  if (c && (c as { owner_id: string }).owner_id === userId) return true;

  const { data: m } = await client
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  const role = (m as { role: string } | null)?.role;
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Owner-only gate for editing/deleting articles. RLS allows the article author
 * or the community owner; we tighten the UI/server-action layer to OWNER only.
 */
export async function canManageCommunityArticle(communityId: string): Promise<boolean> {
  const user = await getCachedAuthUser();
  const userId = user?.id;
  if (!userId) return false;

  const client = await getServerClient();

  const { data: c } = await client
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .maybeSingle();
  return Boolean(c && (c as { owner_id: string }).owner_id === userId);
}
