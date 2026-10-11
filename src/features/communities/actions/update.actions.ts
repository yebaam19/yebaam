'use server';

import { getServerClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { isValidWebsite } from '@/lib/safe-href';
import { requireCommunityOwner } from '../server/community-roles.server';
import { scheduleAssetCleanup } from '../server/schedule-asset-cleanup.server';
import type { UpdateCommunityDto } from '../types/community.types';
import {
  type ActionResult,
  requireUserId,
  revalidateCommunityPaths,
} from './_shared';

export async function updateCommunity(
  dto: UpdateCommunityDto,
): Promise<ActionResult<{ slug: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  if (!isValidWebsite(dto.website)) {
    return { ok: false, error: 'El sitio web debe ser una URL http(s) válida.' };
  }
  if (Object.hasOwn(dto, 'coverImageId') || Object.hasOwn(dto, 'profileImageId')) {
    return { ok: false, error: 'Edita la portada y el logo desde sus controles de imagen.' };
  }

  const client = await getServerClient();

  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) patch.name = dto.name.trim();
  if (dto.description !== undefined) patch.description = dto.description;
  if (dto.category !== undefined) patch.category = dto.category;
  if (dto.privacy !== undefined) patch.privacy = dto.privacy;
  if (dto.location !== undefined) patch.location = dto.location;
  if (dto.website !== undefined) patch.website = dto.website;
  if (dto.tags !== undefined) patch.tags = dto.tags;
  if (dto.allowMemberPosts !== undefined) patch.allow_member_posts = dto.allowMemberPosts;
  if (dto.requireApproval !== undefined) patch.require_approval = dto.requireApproval;
  if (dto.rules !== undefined) {
    patch.rules = dto.rules.map((r, idx) => ({
      id: `rule-${idx}`,
      title: r.title,
      description: r.description,
      order: typeof r.order === 'number' ? r.order : idx + 1,
    }));
  }

  const { data, error } = await client
    .from('communities')
    .update(patch)
    .eq('id', dto.id)
    .select('slug')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'No autorizado o comunidad no encontrada.' };

  revalidateCommunityPaths(data.slug);
  return { ok: true, data: { slug: data.slug } };
}

export async function deleteCommunity(id: string): Promise<ActionResult<{ id: string }>> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: 'Comunidad inválida.' };
  const owner = await requireCommunityOwner(id);
  if (!owner.ok) return { ok: false, error: 'Solo el propietario puede eliminar la comunidad.' };

  const { data, error } = await owner.session.client.from('communities')
    .delete().eq('id', id).select('id').maybeSingle();
  if (error || !data) return { ok: false, error: 'No se pudo eliminar la comunidad.' };

  scheduleAssetCleanup();
  revalidateCommunityPaths(owner.slug);
  return { ok: true, data: { id } };
}
