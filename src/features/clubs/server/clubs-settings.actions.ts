'use server';

import type { UpdateClubDto } from '@/features/clubs/types/club.types';
import { extractImageId } from '@/lib/media/urls';
import { isValidWebsite } from '@/lib/safe-href';
import { getServiceClient } from '@/utils/supabase/server';
import { revalidateClubPaths } from './clubs-helpers';
import { ActionResult,canManageClubMembers,requireUser } from './clubs-helpers';

export async function updateClubAction(
  clubId: string,
  dto: UpdateClubDto,
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const canManage = await canManageClubMembers(client, clubId, userId);
  if (!canManage) return { ok: false, error: 'No tienes permiso para editar este club' };

  if (dto.name !== undefined && !dto.name.trim()) {
    return { ok: false, error: 'El nombre no puede estar vacío' };
  }
  if (dto.description !== undefined && !dto.description.trim()) {
    return { ok: false, error: 'La descripción no puede estar vacía' };
  }
  if (dto.website !== undefined && !isValidWebsite(dto.website)) {
    return { ok: false, error: 'URL de sitio web no válida' };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dto.name !== undefined) patch.name = dto.name.trim();
  if (dto.description !== undefined) patch.description = dto.description.trim();
  if (dto.category !== undefined) patch.category = dto.category;
  if (dto.subcategory !== undefined) patch.subcategory = dto.subcategory.trim() || null;
  if (dto.privacy !== undefined) patch.privacy = dto.privacy;
  if (dto.location !== undefined) patch.location = dto.location.trim() || null;
  if (dto.website !== undefined) patch.website = dto.website.trim() || null;
  if (dto.rules !== undefined) {
    patch.rules = dto.rules.map((r) => r.trim()).filter(Boolean);
  }
  if (dto.tags !== undefined) patch.tags = dto.tags;

  if (Object.keys(patch).length === 1) {
    return { ok: false, error: 'No hay cambios para guardar' };
  }

  const svc = getServiceClient();
  const { data: updated, error } = await svc
    .from('clubs')
    .update(patch)
    .eq('id', clubId)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: 'No se pudo guardar (club no encontrado)' };

  revalidateClubPaths();
  return { ok: true };
}

export async function updateClubImagesAction(
  clubId: string,
  fields: { profileImageUrl?: string; coverImageUrl?: string },
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { data: club } = await client
    .from('clubs')
    .select('owner_id')
    .eq('id', clubId)
    .maybeSingle();
  if (!club) return { ok: false, error: 'Club no encontrado' };
  if ((club as { owner_id: string }).owner_id !== userId) {
    return { ok: false, error: 'Solo el propietario puede cambiar las imágenes' };
  }

  // House rule: persist the bare Cloudflare Images id, never the delivery URL.
  // Older callers sent full imagedelivery.net URLs — reduce those to their id;
  // anything else (non-Cloudflare URL) is stored verbatim as a legacy value.
  const toStoredRef = (value: string): string => extractImageId(value) ?? value;
  const patch: Record<string, string | null> = { updated_at: new Date().toISOString() };
  if (fields.profileImageUrl !== undefined) patch.profile_image_url = toStoredRef(fields.profileImageUrl);
  if (fields.coverImageUrl !== undefined) patch.cover_image_url = toStoredRef(fields.coverImageUrl);
  if (Object.keys(patch).length === 1) {
    return { ok: false, error: 'No hay cambios para guardar' };
  }

  const { data: updated, error } = await client
    .from('clubs')
    .update(patch)
    .eq('id', clubId)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) {
    return {
      ok: false,
      error: 'No se pudo guardar la imagen (sin permiso o club no encontrado)',
    };
  }
  revalidateClubPaths();
  return { ok: true };
}
