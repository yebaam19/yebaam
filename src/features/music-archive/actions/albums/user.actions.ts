'use server';

import type { CreateAlbumDto, MusicAlbumRow } from '../../types/music.types';
import {
  requireSession,
  revalidateMusic,
  uniqueSlug,
  type ActionResult,
} from '../_shared';

export async function createAlbum(
  dto: CreateAlbumDto,
): Promise<ActionResult<MusicAlbumRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const title = dto.title.trim();
  if (!title) return { ok: false, error: 'El título es obligatorio.' };

  const slug = await uniqueSlug(session.client, 'music_albums', `${title}-${dto.year ?? ''}`);

  const { data, error } = await session.client
    .from('music_albums')
    .insert({
      artist_id: dto.artistId,
      label_id: dto.labelId ?? null,
      title,
      slug,
      year: dto.year ?? null,
      decade: dto.decade ?? null,
      country: dto.country?.trim() || null,
      accompaniment: dto.accompaniment?.trim() || null,
      format: dto.format,
      cover_cf_image_id: dto.coverCfImageId ?? null,
      back_cover_cf_image_id: dto.backCoverCfImageId ?? null,
      label_cf_image_id: dto.labelCfImageId ?? null,
      catalog_number: dto.catalogNumber?.trim() || null,
      notes: dto.notes?.trim() || null,
      condition: dto.condition ?? null,
      for_trade: dto.forTrade ?? false,
      contributed_by: session.userId,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateMusic({ albumSlug: slug });
  return { ok: true, data: data as MusicAlbumRow };
}
