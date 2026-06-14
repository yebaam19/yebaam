'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { adminGate, type ActionResult } from '../_shared';

/** List music clubs with member + post + article counts + forum status
 *  for the admin Clubes tab. Platform-admin only. */
export async function listMusicClubsForAdmin(): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      slug: string;
      description: string;
      rules: string[];
      music_genre_id: string;
      genre_slug: string;
      genre_name: string;
      cover_image_url: string | null;
      member_count: number;
      pending_count: number;
      post_count: number;
      article_count: number;
      forum_enabled: boolean;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const { data: clubs } = await svc
    .from('clubs')
    .select(
      'id, name, slug, description, rules, music_genre_id, cover_image_url, music_genres!inner(slug, name)',
    )
    .eq('category', 'MUSICA')
    .not('music_genre_id', 'is', null)
    .order('name', { ascending: true });
  type GenreJoin = { slug: string; name: string } | Array<{ slug: string; name: string }> | null;
  type Row = {
    id: string;
    name: string;
    slug: string;
    description: string;
    rules: string[] | null;
    music_genre_id: string;
    cover_image_url: string | null;
    music_genres: GenreJoin;
  };
  const rows = ((clubs as unknown as Row[] | null) ?? []).map((r) => {
    const g = Array.isArray(r.music_genres) ? r.music_genres[0] : r.music_genres;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      rules: r.rules ?? [],
      music_genre_id: r.music_genre_id,
      cover_image_url: r.cover_image_url,
      genre_slug: g?.slug ?? '',
      genre_name: g?.name ?? '',
    };
  });
  if (rows.length === 0) return { ok: true, data: [] };
  const ids = rows.map((r) => r.id);
  const [members, posts, articles, foros] = await Promise.all([
    svc.from('club_members').select('club_id, status').in('club_id', ids),
    svc.from('club_posts').select('club_id').in('club_id', ids),
    svc.from('music_articles').select('club_id').in('club_id', ids),
    svc
      .from('forum_spaces')
      .select('owner_id, enabled')
      .eq('owner_type', 'club')
      .in('owner_id', ids),
  ]);
  const memberCount = new Map<string, number>();
  const pendingCount = new Map<string, number>();
  for (const m of ((members.data ?? []) as Array<{ club_id: string; status: string }>)) {
    if (m.status === 'approved')
      memberCount.set(m.club_id, (memberCount.get(m.club_id) ?? 0) + 1);
    else if (m.status === 'pending')
      pendingCount.set(m.club_id, (pendingCount.get(m.club_id) ?? 0) + 1);
  }
  const postCount = new Map<string, number>();
  for (const p of ((posts.data ?? []) as Array<{ club_id: string }>))
    postCount.set(p.club_id, (postCount.get(p.club_id) ?? 0) + 1);
  const articleCount = new Map<string, number>();
  for (const a of ((articles.data ?? []) as Array<{ club_id: string | null }>))
    if (a.club_id)
      articleCount.set(a.club_id, (articleCount.get(a.club_id) ?? 0) + 1);
  const forumEnabled = new Map<string, boolean>();
  for (const f of ((foros.data ?? []) as Array<{ owner_id: string; enabled: boolean }>))
    forumEnabled.set(f.owner_id, f.enabled);

  return {
    ok: true,
    data: rows.map((r) => ({
      ...r,
      member_count: memberCount.get(r.id) ?? 0,
      pending_count: pendingCount.get(r.id) ?? 0,
      post_count: postCount.get(r.id) ?? 0,
      article_count: articleCount.get(r.id) ?? 0,
      forum_enabled: forumEnabled.get(r.id) ?? false,
    })),
  };
}
