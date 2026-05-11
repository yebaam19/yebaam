'use server';

import { revalidatePath } from 'next/cache';
import { generateUniqueClubSlug } from '@/lib/api/clubs';
import { requireSession, type ActionResult } from './_shared';

interface CreateMusicClubDto {
  name: string;
  musicGenreId: string;
  description?: string;
  coverCfImageId?: string | null;
}

/** Authenticated user creates a new music club. RLS lets any authed user
 *  insert with owner_id = auth.uid(). Slug is auto-derived from name with a
 *  5-attempt collision retry. Creator is enrolled as approved OWNER. */
export async function createMusicClub(
  dto: CreateMusicClubDto,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión para crear un club.' };
  const { client, userId } = session;

  const name = dto.name.trim();
  if (name.length < 3 || name.length > 80) {
    return { ok: false, error: 'El nombre debe tener entre 3 y 80 caracteres.' };
  }
  if (!dto.musicGenreId) {
    return { ok: false, error: 'Selecciona un género musical.' };
  }
  // Verify the genre exists. RLS on `music_genres` allows public select.
  const { data: genre } = await client
    .from('music_genres')
    .select('id')
    .eq('id', dto.musicGenreId)
    .maybeSingle();
  if (!genre) return { ok: false, error: 'Género musical inválido.' };

  const description = (dto.description ?? '').trim();
  if (description.length > 1000) {
    return { ok: false, error: 'La descripción no puede exceder 1000 caracteres.' };
  }

  const slug = await generateUniqueClubSlug(client, name);

  const { data: inserted, error } = await client
    .from('clubs')
    .insert({
      owner_id: userId,
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

  // Enroll creator as approved OWNER. status defaults to 'approved' per
  // Phase A.5 migration, so no need to set it explicitly.
  const { error: memErr } = await client
    .from('club_members')
    .upsert(
      { club_id: row.id, user_id: userId, role: 'OWNER', membership_tier: 'FREE' },
      { onConflict: 'club_id,user_id' },
    );
  if (memErr) {
    return { ok: false, error: memErr.message };
  }

  revalidatePath('/musica/clubes');
  revalidatePath('/musica');
  revalidatePath('/admin/music');
  return { ok: true, data: row };
}
