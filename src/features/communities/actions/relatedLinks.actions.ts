'use server';

import { getCommunityRelatedLinks } from '../server/community-related-links.server';
import { relatedLinkArchiveSchema, relatedLinkScopeSchema, relatedLinkWriteSchema } from '../schemas/communityRelatedLink.schema';
import type { RelatedLinkPage } from '../types/communityRelatedLink.types';
import type { ActionResult } from './_shared';
import { planWriteError, runPlanAction } from './plans/_shared';

export async function loadCommunityRelatedLinks(input: unknown): Promise<ActionResult<RelatedLinkPage>> {
  const parsed = relatedLinkScopeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Página de enlaces inválida.' };
  try {
    return { ok: true, data: await getCommunityRelatedLinks(parsed.data.communityId,
      parsed.data.cursor ? JSON.stringify(parsed.data.cursor) : null) };
  } catch {
    return { ok: false, error: 'No se pudieron cargar los enlaces. Inténtalo de nuevo.' };
  }
}

export async function saveCommunityRelatedLink(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runPlanAction(relatedLinkWriteSchema, input, 'settings', async ({ client }, value) => {
    const patch = {
      title: value.title, description: value.description, href: value.href,
      image_asset_id: value.imageAssetId, position: value.position, is_published: value.isPublished,
    };
    const { data: existing, error: readError } = await client.from('community_related_links')
      .select('id,version,deleted_at,title,description,href,image_asset_id,position,is_published')
      .eq('community_id', value.communityId).eq('id', value.id).maybeSingle();
    if (readError) return { ok: false, error: planWriteError(readError.code) };
    if (existing?.deleted_at) return { ok: false, error: 'Este enlace fue retirado.' };
    if (existing && Object.entries(patch).every(([key, val]) => existing[key as keyof typeof patch] === val)) {
      return { ok: true, data: { id: value.id } };
    }
    if (existing ? existing.version !== value.expectedVersion : value.expectedVersion !== 0) {
      return { ok: false, error: planWriteError('40001') };
    }
    const query = existing
      ? client.from('community_related_links').update(patch).eq('community_id', value.communityId)
        .eq('id', value.id).eq('version', value.expectedVersion).is('deleted_at', null)
      : client.from('community_related_links').insert({ id: value.id, community_id: value.communityId, ...patch });
    const { data, error } = await query.select('id').maybeSingle();
    if (error || !data) return { ok: false, error: error?.code === '23514' || error?.code === '23503'
      ? 'Publica una imagen de esta comunidad en la biblioteca antes de mostrar el enlace.'
      : planWriteError(error?.code ?? '40001') };
    return { ok: true, data: { id: value.id } };
  });
}

export async function archiveCommunityRelatedLink(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runPlanAction(relatedLinkArchiveSchema, input, 'settings', async ({ client }, value) => {
    const { data: row, error: readError } = await client.from('community_related_links')
      .select('id,version,deleted_at').eq('community_id', value.communityId).eq('id', value.id).maybeSingle();
    if (readError || !row) return { ok: false, error: 'No se encontró el enlace.' };
    if (row.deleted_at) return { ok: true, data: { id: value.id } };
    if (row.version !== value.expectedVersion) return { ok: false, error: planWriteError('40001') };
    const { data, error } = await client.from('community_related_links')
      .update({ deleted_at: new Date().toISOString() }).eq('community_id', value.communityId)
      .eq('id', value.id).eq('version', value.expectedVersion).is('deleted_at', null)
      .select('id').maybeSingle();
    if (error || !data) return { ok: false, error: planWriteError(error?.code ?? '40001') };
    return { ok: true, data: { id: value.id } };
  });
}
