import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { imageUrl, withImageVariant } from '@/lib/media/urls';
import { sanitizeCommunityArticleContent, splitCommunityArticleContent } from '../lib/article-content';
import { getCommunityProfileCapabilities } from './community-plan.server';
import { ASSET_COLUMNS } from './community-library.server';
import type { LibraryAsset } from '../types/communityLibrary.types';
import type { CommunityArticle, CommunityArticleAuthor, CommunityArticleSummary } from '../types/communityArticle.types';

type ArticleRow = {
  id: string; community_id: string; author_id: string; slug: string; title: string;
  subtitle: string | null; content: string; summary: string | null; cf_image_id: string | null;
  cover_asset_id: string | null; attachment_ids: string[]; category: string; version: number;
  is_published: boolean; read_time: number | null; tags: string[] | null;
  published_at: string | null; created_at: string; updated_at: string;
};
type ProfileRow = { id: string; username: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null };

const COLUMNS = 'id,community_id,author_id,slug,title,subtitle,content,summary,cf_image_id,cover_asset_id,attachment_ids,category,version,is_published,read_time,tags,published_at,created_at,updated_at';
const SUMMARY_COLUMNS = 'id,community_id,author_id,slug,title,subtitle,summary,cf_image_id,cover_asset_id,category,version,is_published,read_time,tags,published_at,created_at,updated_at';
const PAGE_SIZE = 24;

function toAuthor(row?: ProfileRow): CommunityArticleAuthor {
  if (!row) return { id: '', username: 'usuario', name: 'Usuario', avatar: null };
  return { id: row.id, username: row.username ?? 'usuario',
    name: [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.username || 'Usuario',
    avatar: row.avatar_url ? withImageVariant(row.avatar_url, 'avatar') : null };
}

async function loadAuthors(ids: string[]): Promise<Map<string, CommunityArticleAuthor>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, CommunityArticleAuthor>();
  if (!unique.length) return map;
  const client = await getServerClient();
  const { data, error } = await client.from('profiles')
    .select('id,username,first_name,last_name,avatar_url').in('id', unique);
  if (error) throw new Error('No se pudieron cargar los autores.');
  for (const row of (data ?? []) as ProfileRow[]) map.set(row.id, toAuthor(row));
  return map;
}

async function loadCoverIds(communityId: string, rows: Pick<ArticleRow, 'cover_asset_id'>[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.flatMap((row) => row.cover_asset_id ? [row.cover_asset_id] : []))];
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const client = await getServerClient();
  const { data, error } = await client.from('community_library_assets')
    .select('id,media_id').eq('community_id', communityId).in('id', ids).eq('kind', 'image').is('deleted_at', null);
  if (error) throw new Error('No se pudieron cargar las portadas.');
  for (const row of data ?? []) map.set(row.id, row.media_id);
  return map;
}

function coverUrl(row: Pick<ArticleRow, 'cover_asset_id' | 'cf_image_id'>, covers: Map<string, string>): string | null {
  const id = row.cover_asset_id ? covers.get(row.cover_asset_id) : row.cf_image_id;
  if (!id) return null;
  try { return imageUrl(id, 'public'); } catch { return null; }
}

function toSummary(row: Omit<ArticleRow, 'content' | 'attachment_ids'>,
  author: CommunityArticleAuthor, covers: Map<string, string>): CommunityArticleSummary {
  return { id: row.id, communityId: row.community_id, slug: row.slug, title: row.title,
    subtitle: row.subtitle, summary: row.summary, coverImageUrl: coverUrl(row, covers),
    readTime: row.read_time, tags: row.tags ?? [], publishedAt: row.published_at,
    isPublished: row.is_published, category: row.category, version: row.version, author };
}

function toArticle(row: ArticleRow, author: CommunityArticleAuthor, covers: Map<string, string>): CommunityArticle {
  const content = sanitizeCommunityArticleContent(row.content);
  return { ...toSummary(row, author, covers), content, coverAssetId: row.cover_asset_id,
    attachmentIds: row.attachment_ids ?? [],
    embeddedAssetIds: splitCommunityArticleContent(content).flatMap((part) => part.assetId ? [part.assetId] : []),
    createdAt: row.created_at, updatedAt: row.updated_at };
}

export const getCommunityArticleAssets = cache(async (communityId: string, ids: string[]): Promise<LibraryAsset[]> => {
  z.uuid().parse(communityId);
  const unique = [...new Set(ids.filter((id) => z.uuid().safeParse(id).success))].slice(0, 40);
  if (!unique.length) return [];
  const client = await getServerClient();
  const { data, error } = await client.from('community_library_assets').select(ASSET_COLUMNS)
    .eq('community_id', communityId).in('id', unique).is('deleted_at', null).limit(40);
  if (error) throw new Error('No se pudieron cargar los medios del artículo.');
  return (data ?? []) as LibraryAsset[];
});

const cursorSchema = z.object({ createdAt: z.iso.datetime({ offset: true }), id: z.uuid() });

export const getCommunityArticlePage = cache(async (
  communityId: string, search = '', category = '', cursorJson: string | null = null, includeDrafts = false,
): Promise<{ items: CommunityArticleSummary[]; nextCursor: string | null }> => {
  z.uuid().parse(communityId);
  const cursor = cursorJson ? cursorSchema.parse(JSON.parse(cursorJson)) : null;
  const client = await getServerClient();
  let query = client.from('community_articles').select(SUMMARY_COLUMNS)
    .eq('community_id', communityId).is('deleted_at', null).is('hidden_at', null)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (!includeDrafts) query = query.eq('is_published', true);
  if (search.trim()) query = query.textSearch('search_vector', search.trim().slice(0, 100), { type: 'websearch', config: 'spanish' });
  if (category.trim()) query = query.eq('category', category.trim().slice(0, 120));
  if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar los artículos.');
  const all = (data ?? []) as Omit<ArticleRow, 'content' | 'attachment_ids'>[];
  const rows = all.slice(0, PAGE_SIZE);
  const [authors, covers] = await Promise.all([
    loadAuthors(rows.map((row) => row.author_id)), loadCoverIds(communityId, rows),
  ]);
  const last = rows.at(-1);
  return { items: rows.map((row) => toSummary(row, authors.get(row.author_id) ?? toAuthor(), covers)),
    nextCursor: all.length > PAGE_SIZE && last ? JSON.stringify({ createdAt: last.created_at, id: last.id }) : null };
});

export const getCommunityArticleBySlug = cache(async (
  communityId: string, slug: string,
): Promise<CommunityArticle | null> => {
  if (!z.uuid().safeParse(communityId).success || !slug) return null;
  const client = await getServerClient();
  const { data, error } = await client.from('community_articles').select(COLUMNS)
    .eq('community_id', communityId).eq('slug', slug).is('deleted_at', null).maybeSingle();
  if (error) throw new Error('No se pudo cargar el artículo.');
  if (!data) return null;
  const row = data as ArticleRow;
  const [authors, covers] = await Promise.all([
    loadAuthors([row.author_id]), loadCoverIds(communityId, [row]),
  ]);
  return toArticle(row, authors.get(row.author_id) ?? toAuthor(), covers);
});

export async function getCommunityArticleForEdit(communityId: string, slug: string): Promise<CommunityArticle | null> {
  return getCommunityArticleBySlug(communityId, slug);
}

// Legacy moderation actions also call this helper for membership administration.
// Keep its original owner/admin rule separate from the content-editor capability.
export async function canPublishCommunityArticle(communityId: string): Promise<boolean> {
  const user = await getCachedAuthUser();
  if (!user?.id) return false;
  const client = await getServerClient();
  const { data: community } = await client.from('communities').select('owner_id').eq('id', communityId).maybeSingle();
  if (community?.owner_id === user.id) return true;
  const { data: member } = await client.from('community_members').select('role')
    .eq('community_id', communityId).eq('user_id', user.id).eq('status', 'active').maybeSingle();
  return member?.role === 'OWNER' || member?.role === 'ADMIN';
}

export async function canManageCommunityArticle(communityId: string): Promise<boolean> {
  return (await getCommunityProfileCapabilities(communityId)).content;
}
