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
  return { ok: true, data: { deleted: true } };
}

export type UnlinkedClubRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
};

/** Clubs that exist in `clubs` but lack `music_genre_id` — they won't appear
 *  in the album editor until linked to a genre. Platform-admin only. */
export async function listClubsPendingMusicActivation(
  query?: string,
): Promise<ActionResult<UnlinkedClubRow[]>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();

  let q = svc
    .from('clubs')
    .select('id, name, slug, description, category')
    .is('music_genre_id', null)
    .order('name', { ascending: true })
    .limit(50);

  const term = (query ?? '').trim();
  if (term.length >= 2) {
    const escaped = term.replace(/[\\%_]/g, '\\$&');
    const pattern = `%${escaped}%`;
    q = q.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    data: ((data ?? []) as UnlinkedClubRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      category: r.category,
    })),
  };
}

/** Link an existing club row to a music genre so it appears in /admin/music
 *  album assignment and /musica/clubes. Sets category to MUSICA. */
export async function linkClubToMusicGenre(
  clubId: string,
  musicGenreId: string,
): Promise<
  ActionResult<{
    id: string;
    slug: string;
    name: string;
    description: string;
    rules: string[];
    music_genre_id: string;
    genre_slug: string;
    genre_name: string;
    cover_image_url: string | null;
  }>
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  if (!musicGenreId) return { ok: false, error: 'Selecciona un género musical.' };

  const svc = getServiceClient();
  const { data: genre } = await svc
    .from('music_genres')
    .select('id, slug, name')
    .eq('id', musicGenreId)
    .maybeSingle();
  if (!genre) return { ok: false, error: 'Género musical inválido.' };

  const { data: club } = await svc
    .from('clubs')
    .select('id, name, slug, description, rules, cover_image_url, music_genre_id')
    .eq('id', clubId)
    .maybeSingle();
  if (!club) return { ok: false, error: 'Club no encontrado.' };
  if ((club as { music_genre_id: string | null }).music_genre_id) {
    return { ok: false, error: 'Este club ya está vinculado a un género.' };
  }

  const { data: updated, error } = await svc
    .from('clubs')
    .update({
      category: 'MUSICA',
      music_genre_id: musicGenreId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clubId)
    .select('id, name, slug, description, rules, cover_image_url, music_genre_id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: 'No se pudo vincular el club.' };

  const row = updated as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    rules: string[] | null;
    cover_image_url: string | null;
    music_genre_id: string;
  };
  const g = genre as { slug: string; name: string };

  revalidatePath('/admin/music');
  revalidatePath('/musica/clubes');
  revalidatePath('/musica');
  revalidatePath(`/musica/clubes/${row.slug}`, 'layout');

  return {
    ok: true,
    data: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? '',
      rules: row.rules ?? [],
      music_genre_id: row.music_genre_id,
      genre_slug: g.slug,
      genre_name: g.name,
      cover_image_url: row.cover_image_url,
    },
  };
}
