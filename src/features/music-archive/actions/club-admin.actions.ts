'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { deleteImage } from '@/lib/cloudflare/images';
import { ensureClubForumSpace, generateUniqueClubSlug } from '@/lib/api/clubs';
import { getServiceClient } from '@/utils/supabase/server';
import { adminGate, type ActionResult } from './_shared';

interface UpdateClubProfileDto {
  description?: string;
  rules?: string[];
  coverCfImageId?: string | null;
  name?: string;
  musicGenreId?: string;
}

/** Platform-admin edit of a music club's profile fields. We use the service
 *  client because clubs.UPDATE is RLS-gated to club owners by default and
 *  platform admin should be able to edit any of the seeded clubs. */
export async function updateClubProfile(
  clubId: string,
  dto: UpdateClubProfileDto,
): Promise<ActionResult<{ updated: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const updates: Record<string, unknown> = {};
  if (dto.name !== undefined) {
    const n = dto.name.trim();
    if (!n) return { ok: false, error: 'Nombre no puede estar vacío.' };
    updates.name = n;
  }
  if (dto.description !== undefined) updates.description = dto.description;
  if (dto.rules !== undefined) updates.rules = dto.rules;
  if (dto.coverCfImageId !== undefined) updates.cover_image_url = dto.coverCfImageId;
  if (dto.musicGenreId !== undefined) {
    // Verify the genre exists. RLS allows public select on music_genres.
    const { data: g } = await svc.from('music_genres').select('id').eq('id', dto.musicGenreId).maybeSingle();
    if (!g) return { ok: false, error: 'Género inválido.' };
    updates.music_genre_id = dto.musicGenreId;
  }
  const { data, error } = await svc
    .from('clubs')
    .update(updates)
    .eq('id', clubId)
    .select('slug')
    .single();
  if (error) return { ok: false, error: error.message };
  const slug = (data as { slug: string } | null)?.slug;
  if (slug) {
    revalidatePath(`/musica/clubes/${slug}`, 'layout');
  }
  revalidatePath('/admin/music');
  return { ok: true, data: { updated: true } };
}

/** Toggle a forum_spaces row on/off for a music club. Reuses the shared
 *  `ensureClubForumSpace` helper from src/lib/api/clubs.ts which also seeds
 *  the default category + forum so the board renders on day one. */
export async function toggleClubForum(
  clubId: string,
  enable: boolean,
): Promise<ActionResult<{ spaceSlug: string | null }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const { data: club } = await svc
    .from('clubs')
    .select('id, name, slug, owner_id, privacy')
    .eq('id', clubId)
    .maybeSingle();
  if (!club) return { ok: false, error: 'Club no encontrado.' };
  const c = club as {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    privacy: string;
  };
  if (enable) {
    const res = await ensureClubForumSpace(c);
    if (!res) return { ok: false, error: 'No se pudo crear el foro.' };
    revalidatePath(`/musica/clubes/${c.slug}/foro`);
    revalidatePath('/admin/music');
    return { ok: true, data: { spaceSlug: res.spaceSlug } };
  }
  const { error } = await svc
    .from('forum_spaces')
    .update({ enabled: false })
    .eq('owner_type', 'club')
    .eq('owner_id', clubId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/musica/clubes/${c.slug}/foro`);
  revalidatePath('/admin/music');
  return { ok: true, data: { spaceSlug: null } };
}

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

/** Recent posts across all music clubs for the moderation panel. */
export async function listRecentMusicClubPosts(
  limit = 30,
): Promise<
  ActionResult<
    Array<{
      id: string;
      club_id: string;
      club_name: string;
      club_slug: string;
      author_id: string;
      author_name: string | null;
      title: string | null;
      body: string | null;
      created_at: string;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const { data } = await svc
    .from('club_posts')
    .select('id, club_id, author_id, title, body, created_at, clubs!inner(name, slug, category)')
    .eq('clubs.category', 'MUSICA')
    .order('created_at', { ascending: false })
    .limit(limit);
  type Row = {
    id: string;
    club_id: string;
    author_id: string;
    title: string | null;
    body: string | null;
    created_at: string;
    clubs:
      | { name: string; slug: string }
      | Array<{ name: string; slug: string }>;
  };
  const rows = ((data as unknown as Row[] | null) ?? []).map((r) => ({
    ...r,
    clubs: Array.isArray(r.clubs) ? r.clubs[0] : r.clubs,
  }));
  if (rows.length === 0) return { ok: true, data: [] };
  const { data: profiles } = await svc
    .from('profiles')
    .select('id, username, display_name, first_name, last_name')
    .in(
      'id',
      rows.map((r) => r.author_id),
    );
  const nameById = new Map<string, string | null>();
  for (const p of ((profiles ?? []) as Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  }>)) {
    const composed = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    nameById.set(p.id, p.display_name ?? composed ?? p.username ?? null);
  }
  return {
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      club_id: r.club_id,
      club_name: r.clubs?.name ?? '—',
      club_slug: r.clubs?.slug ?? '',
      author_id: r.author_id,
      author_name: nameById.get(r.author_id) ?? null,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
    })),
  };
}

/** Recent articles across all music clubs. */
export async function listRecentMusicClubArticles(
  limit = 30,
): Promise<
  ActionResult<
    Array<{
      id: string;
      slug: string;
      club_id: string;
      club_name: string;
      club_slug: string;
      author_id: string;
      author_name: string | null;
      title: string;
      published_at: string | null;
      created_at: string;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const { data } = await svc
    .from('music_articles')
    .select(
      'id, slug, club_id, author_id, title, published_at, created_at, clubs!inner(name, slug, category)',
    )
    .eq('clubs.category', 'MUSICA')
    .order('created_at', { ascending: false })
    .limit(limit);
  type Row = {
    id: string;
    slug: string;
    club_id: string;
    author_id: string;
    title: string;
    published_at: string | null;
    created_at: string;
    clubs: { name: string; slug: string } | Array<{ name: string; slug: string }>;
  };
  const rows = ((data as unknown as Row[] | null) ?? []).map((r) => ({
    ...r,
    clubs: Array.isArray(r.clubs) ? r.clubs[0] : r.clubs,
  }));
  const { data: profiles } = await svc
    .from('profiles')
    .select('id, username, display_name, first_name, last_name')
    .in(
      'id',
      rows.map((r) => r.author_id),
    );
  const nameById = new Map<string, string | null>();
  for (const p of ((profiles ?? []) as Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  }>)) {
    const composed = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    nameById.set(p.id, p.display_name ?? composed ?? p.username ?? null);
  }
  return {
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      club_id: r.club_id,
      club_name: r.clubs?.name ?? '—',
      club_slug: r.clubs?.slug ?? '',
      author_id: r.author_id,
      author_name: nameById.get(r.author_id) ?? null,
      title: r.title,
      published_at: r.published_at,
      created_at: r.created_at,
    })),
  };
}

/** All approved members across all music clubs, joined with club + profile. */
export async function listAllMusicClubMembers(): Promise<
  ActionResult<
    Array<{
      user_id: string;
      club_id: string;
      club_name: string;
      club_slug: string;
      role: string;
      joined_at: string;
      username: string | null;
      full_name: string | null;
      avatar_cf_image_id: string | null;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const { data } = await svc
    .from('club_members')
    .select(
      'user_id, club_id, role, joined_at, clubs!inner(name, slug, category)',
    )
    .eq('status', 'approved')
    .eq('clubs.category', 'MUSICA')
    .order('joined_at', { ascending: false });
  type Row = {
    user_id: string;
    club_id: string;
    role: string;
    joined_at: string;
    clubs: { name: string; slug: string } | Array<{ name: string; slug: string }>;
  };
  const rows = ((data as unknown as Row[] | null) ?? []).map((r) => ({
    ...r,
    clubs: Array.isArray(r.clubs) ? r.clubs[0] : r.clubs,
  }));
  const { data: profiles } = await svc
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_cloudflare_id')
    .in(
      'id',
      rows.map((r) => r.user_id),
    );
  const profById = new Map<
    string,
    {
      username: string | null;
      full_name: string | null;
      avatar_cf_image_id: string | null;
    }
  >();
  for (const p of ((profiles ?? []) as Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_cloudflare_id: string | null;
  }>)) {
    const composed = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    profById.set(p.id, {
      username: p.username,
      full_name: p.display_name ?? (composed || null),
      avatar_cf_image_id: p.avatar_cloudflare_id,
    });
  }
  return {
    ok: true,
    data: rows.map((r) => {
      const p = profById.get(r.user_id);
      return {
        user_id: r.user_id,
        club_id: r.club_id,
        club_name: r.clubs?.name ?? '—',
        club_slug: r.clubs?.slug ?? '',
        role: r.role,
        joined_at: r.joined_at,
        username: p?.username ?? null,
        full_name: p?.full_name ?? null,
        avatar_cf_image_id: p?.avatar_cf_image_id ?? null,
      };
    }),
  };
}

interface AdminCreateMusicClubDto {
  name: string;
  musicGenreId: string;
  description?: string;
  coverCfImageId?: string | null;
}

/** Platform-admin create of a music club. Uses the service client to bypass
 *  RLS so the admin can seed clubs regardless of the user-facing owner-id
 *  constraint. Mirrors `createMusicClub` defaults so the result is
 *  indistinguishable from a user-created club. */
export async function adminCreateMusicClub(
  dto: AdminCreateMusicClubDto,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;

  const name = dto.name.trim();
  if (name.length < 3 || name.length > 80) {
    return { ok: false, error: 'El nombre debe tener entre 3 y 80 caracteres.' };
  }
  if (!dto.musicGenreId) {
    return { ok: false, error: 'Selecciona un género musical.' };
  }
  const description = (dto.description ?? '').trim();
  if (description.length > 1000) {
    return { ok: false, error: 'La descripción no puede exceder 1000 caracteres.' };
  }

  const svc = getServiceClient();
  const { data: genre } = await svc
    .from('music_genres')
    .select('id')
    .eq('id', dto.musicGenreId)
    .maybeSingle();
  if (!genre) return { ok: false, error: 'Género musical inválido.' };

  const slug = await generateUniqueClubSlug(svc, name);

  const { data: inserted, error } = await svc
    .from('clubs')
    .insert({
      owner_id: gate.userId,
      name,
      slug,
      description,
      category: 'MUSICA',
      privacy: 'PUBLIC',
      music_genre_id: dto.musicGenreId,
      cover_image_url: dto.coverCfImageId || null,
      membership_tiers: ['FREE'],
      rules: [],
      tags: [],
    })
    .select('id, slug')
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'No se pudo crear el club.' };
  }
  const row = inserted as { id: string; slug: string };

  const { error: memErr } = await svc
    .from('club_members')
    .upsert(
      { club_id: row.id, user_id: gate.userId, role: 'OWNER', membership_tier: 'FREE' },
      { onConflict: 'club_id,user_id' },
    );
  if (memErr) return { ok: false, error: memErr.message };

  revalidatePath('/admin/music');
  revalidatePath('/musica/clubes');
  revalidatePath('/musica');
  return { ok: true, data: row };
}

/** Platform-admin hard delete of a music club. DB cascades clean up
 *  club_members, club_posts, club_links, club_albums, club_badges,
 *  club_events, club_invites, club_promotions, club_reports,
 *  music_album_clubs, music_media_clubs, and conversations. Polymorphic
 *  refs (forum_spaces / public_chat_topics keyed on owner_type='club') are
 *  cleared explicitly because they have no FK. music_articles.club_id is
 *  ON DELETE SET NULL so articles persist as authored-but-unclubbed (by
 *  design — preserves user-authored content). */
export async function adminDeleteMusicClub(
  clubId: string,
): Promise<ActionResult<{ deleted: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();

  const { data: club } = await svc
    .from('clubs')
    .select('id, slug, cover_image_url')
    .eq('id', clubId)
    .maybeSingle();
  if (!club) return { ok: false, error: 'Club no encontrado.' };
  const c = club as { id: string; slug: string; cover_image_url: string | null };

  // Clear polymorphic owners (no FK so cascade can't do it).
  await Promise.all([
    svc.from('forum_spaces').delete().eq('owner_type', 'club').eq('owner_id', c.id),
    svc
      .from('public_chat_topics')
      .delete()
      .eq('owner_type', 'club')
      .eq('owner_id', c.id),
  ]);

  const { error } = await svc.from('clubs').delete().eq('id', c.id);
  if (error) return { ok: false, error: error.message };

  // Best-effort cover image cleanup. CDN orphan is recoverable later; DB
  // integrity already succeeded, so don't fail the response on this.
  if (c.cover_image_url) {
    after(async () => {
      await deleteImage(c.cover_image_url!).catch(() => {});
    });
  }

  revalidatePath('/admin/music');
  revalidatePath('/musica/clubes');
  revalidatePath('/musica');
  revalidatePath(`/musica/clubes/${c.slug}`, 'layout');
  return { ok: true, data: { deleted: true } };
}
