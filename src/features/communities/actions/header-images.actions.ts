'use server';
import { revalidatePath } from 'next/cache';
import { getImageProvenance } from '@/lib/cloudflare/images';
import { getServiceClient } from '@/utils/supabase/server';
import { requireProfileSession } from '../server/profile-session.server';
import type { ActionResult } from './_shared';
import { headerImageSchema, DEFAULT_IMAGE_FRAMING } from '../schemas/communityHeaderImage.schema';

export async function saveCommunityHeaderImage(input: unknown): Promise<ActionResult<{ version: number }>> {
  const parsed = headerImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa la imagen y su encuadre.' };
  try {
    const value = parsed.data;
    const access = await requireProfileSession(value.communityId, 'settings');
    if (!access.ok) return { ok: false, error: access.error };
    const { client, userId } = access.session;
    const { data: row, error: readError } = await client.from('communities')
      .select('cover_image,profile_image,cover_framing,profile_framing,header_image_version')
      .eq('id', value.communityId).maybeSingle();
    if (readError || !row) return { ok: false, error: 'No tienes permiso para editar estas imágenes.' };
    const imageKey = `${value.target}_image` as 'cover_image' | 'profile_image';
    const framingKey = `${value.target}_framing` as 'cover_framing' | 'profile_framing';
    const framing = value.imageId ? value.framing : DEFAULT_IMAGE_FRAMING;
    // A lost response can be retried without another revision or upload.
    if (row[imageKey] === value.imageId && ['x', 'y', 'zoom'].every((key) => row[framingKey][key] === framing[key as keyof typeof framing])) {
      revalidatePath('/feed/comunidades/[slug]', 'layout');
      return { ok: true, data: { version: row.header_image_version } };
    }
    if (row.header_image_version !== value.expectedVersion) return { ok: false, error: 'Las imágenes cambiaron. Recarga antes de guardar; conserva tu archivo para volver a seleccionarlo.' };
    if (value.imageId && value.imageId !== row[imageKey]) {
      const provenance = await getImageProvenance(value.imageId);
      if (!provenance?.ready || provenance.requiresSignature || provenance.uploadedBy !== userId) {
        return { ok: false, error: 'La imagen no está disponible o no pertenece a tu cuenta.' };
      }
    }
    const { data, error } = await getServiceClient().rpc('save_community_header_image', {
      p_community_id: value.communityId, p_actor_id: userId, p_target: value.target,
      p_image_id: value.imageId, p_framing: framing, p_expected_version: value.expectedVersion,
    });
    if (error?.code === '40001') return { ok: false, error: 'Las imágenes cambiaron. Recarga antes de guardar; conserva tu archivo para volver a seleccionarlo.' };
    if (error?.code === '42501') return { ok: false, error: 'Ya no tienes permiso para editar estas imágenes.' };
    if (error || typeof data !== 'number') return { ok: false, error: 'No se pudo guardar la imagen. Inténtalo de nuevo.' };
    revalidatePath('/feed/comunidades');
    revalidatePath('/feed/comunidades/[slug]', 'layout');
    return { ok: true, data: { version: data } };
  } catch {
    return { ok: false, error: 'No se pudo guardar la imagen. Tu selección se conserva para reintentar.' };
  }
}
