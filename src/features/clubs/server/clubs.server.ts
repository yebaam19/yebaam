import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { loadClubContext, mapClub, type ClubRow } from '@/lib/api/clubs';
import type { Club } from '../types/club.types';

export type ClubPostKind = 'PHOTO' | 'VIDEO' | 'ARTICLE' | 'FILE';

export interface ClubPost {
  id: string;
  clubId: string;
  authorId: string;
  kind: ClubPostKind;
  title: string | null;
  body: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  albumId: string | null;
  views: number;
  reactionsCount: number;
  commentsCount: number;
  isFeatured: boolean;
  createdAt: string;
  author?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface ClubBadge {
  id: string;
  code: string;
  label: string;
  icon: string | null;
  description: string | null;
}

export interface ClubEventLite {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  isOnline: boolean;
  coverUrl: string | null;
  attendeesCount: number;
}

export interface ClubPromotionLite {
  id: string;
  businessName: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

export interface ClubMemberLite {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  membershipTier: string;
  joinedAt: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

type PostRow = {
  id: string;
  club_id: string;
  author_id: string;
  kind: ClubPostKind;
  title: string | null;
  body: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  album_id: string | null;
  views: number;
  reactions_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
};

function mapPost(row: PostRow, authors?: Map<string, ClubPost['author']>): ClubPost {
  return {
    id: row.id,
    clubId: row.club_id,
    authorId: row.author_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    albumId: row.album_id,
    views: row.views,
    reactionsCount: row.reactions_count,
    commentsCount: row.comments_count,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    author: authors?.get(row.author_id),
  };
}

async function attachAuthors(
  client: Awaited<ReturnType<typeof getServerClient>>,
  rows: PostRow[],
): Promise<Map<string, ClubPost['author']>> {
  const ids = Array.from(new Set(rows.map((r) => r.author_id)));
  if (!ids.length) return new Map();
  const { data } = await client
    .from('profiles')
    .select('id,username,display_name,first_name,last_name,avatar_url')
    .in('id', ids);
  const map = new Map<string, ClubPost['author']>();
  for (const p of (data ?? []) as Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  }>) {
    map.set(p.id, {
      id: p.id,
      username: p.username,
      displayName:
        p.display_name ||
        [p.first_name, p.last_name].filter(Boolean).join(' ') ||
        p.username,
      avatarUrl: p.avatar_url,
    });
  }
  return map;
}

export const getClubBySlug = cache(async (slug: string): Promise<Club | null> => {
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as ClubRow;
  const ctx = await loadClubContext(client, [row], viewerId);
  return mapClub(row, { userId: viewerId, ...ctx }, ctx.owners.get(row.owner_id)) as unknown as Club;
});

export async function getClubPosts(
  clubId: string,
  opts: { kind?: ClubPostKind; limit?: number; offset?: number } = {},
): Promise<ClubPost[]> {
  const client = await getServerClient();
  let q = client
    .from('club_posts')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });
  if (opts.kind) q = q.eq('kind', opts.kind);
  const limit = opts.limit ?? 12;
  const offset = opts.offset ?? 0;
  q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error || !data) return [];
  const rows = data as PostRow[];
  const authors = await attachAuthors(client, rows);
  return rows.map((r) => mapPost(r, authors));
}

export async function getClubHighlights(clubId: string): Promise<{
  mostRecent: ClubPost | null;
  mostViewed: ClubPost | null;
  mostReacted: ClubPost | null;
}> {
  const client = await getServerClient();
  const [recent, viewed, reacted] = await Promise.all([
    client
      .from('club_posts')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('club_posts')
      .select('*')
      .eq('club_id', clubId)
      .order('views', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('club_posts')
      .select('*')
      .eq('club_id', clubId)
      .order('reactions_count', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const rows = [recent.data, viewed.data, reacted.data].filter(Boolean) as PostRow[];
  const authors = await attachAuthors(client, rows);
  return {
    mostRecent: recent.data ? mapPost(recent.data as PostRow, authors) : null,
    mostViewed: viewed.data ? mapPost(viewed.data as PostRow, authors) : null,
    mostReacted: reacted.data ? mapPost(reacted.data as PostRow, authors) : null,
  };
}

export async function getClubBadges(clubId: string): Promise<ClubBadge[]> {
  const client = await getServerClient();
  const { data } = await client
    .from('club_badges')
    .select('id,code,label,icon,description')
    .eq('club_id', clubId)
    .order('awarded_at', { ascending: true });
  return (data ?? []) as ClubBadge[];
}

export async function getClubMembers(
  clubId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<ClubMemberLite[]> {
  const client = await getServerClient();
  const limit = opts.limit ?? 30;
  const offset = opts.offset ?? 0;
  const { data } = await client
    .from('club_members')
    .select('user_id,role,membership_tier,joined_at')
    .eq('club_id', clubId)
    .order('joined_at', { ascending: true })
    .range(offset, offset + limit - 1);
  const rows = (data ?? []) as Array<{
    user_id: string;
    role: ClubMemberLite['role'];
    membership_tier: string;
    joined_at: string;
  }>;
  if (!rows.length) return [];
  const { data: profiles } = await client
    .from('profiles')
    .select('id,username,display_name,first_name,last_name,avatar_url')
    .in(
      'id',
      rows.map((r) => r.user_id),
    );
  const byId = new Map(
    (profiles ?? []).map((p: any) => [
      p.id as string,
      {
        username: p.username as string | null,
        displayName:
          (p.display_name as string | null) ||
          [p.first_name, p.last_name].filter(Boolean).join(' ') ||
          p.username,
        avatarUrl: p.avatar_url as string | null,
      },
    ]),
  );
  return rows.map((r) => ({
    userId: r.user_id,
    role: r.role,
    membershipTier: r.membership_tier,
    joinedAt: r.joined_at,
    username: byId.get(r.user_id)?.username ?? null,
    displayName: byId.get(r.user_id)?.displayName ?? null,
    avatarUrl: byId.get(r.user_id)?.avatarUrl ?? null,
  }));
}

export async function getClubEvents(clubId: string): Promise<ClubEventLite[]> {
  const client = await getServerClient();
  const { data } = await client
    .from('club_events')
    .select('id,title,description,starts_at,ends_at,location,is_online,cover_url')
    .eq('club_id', clubId)
    .order('starts_at', { ascending: true });
  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    is_online: boolean;
    cover_url: string | null;
  }>;
  if (!rows.length) return [];

  const { data: counts } = await client
    .from('club_event_attendees')
    .select('event_id')
    .in(
      'event_id',
      rows.map((r) => r.id),
    );
  const countMap = new Map<string, number>();
  for (const c of (counts ?? []) as Array<{ event_id: string }>) {
    countMap.set(c.event_id, (countMap.get(c.event_id) ?? 0) + 1);
  }
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    location: r.location,
    isOnline: r.is_online,
    coverUrl: r.cover_url,
    attendeesCount: countMap.get(r.id) ?? 0,
  }));
}

export async function getClubPromotions(clubId: string): Promise<ClubPromotionLite[]> {
  const client = await getServerClient();
  const { data } = await client
    .from('club_promotions')
    .select('id,business_name,title,description,image_url,url,starts_at,ends_at')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as Array<{
    id: string;
    business_name: string;
    title: string;
    description: string | null;
    image_url: string | null;
    url: string | null;
    starts_at: string | null;
    ends_at: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    businessName: r.business_name,
    title: r.title,
    description: r.description,
    imageUrl: r.image_url,
    url: r.url,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
  }));
}

export async function getClubPublicChatId(clubId: string): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client
    .from('conversations')
    .select('id')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getClubForoSpaceSlug(clubId: string): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client
    .from('forum_spaces')
    .select('slug')
    .eq('owner_type', 'club')
    .eq('owner_id', clubId)
    .maybeSingle();
  return data?.slug ?? null;
}
