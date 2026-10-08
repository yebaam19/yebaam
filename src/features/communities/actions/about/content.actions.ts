'use server';

import { z } from 'zod';
import { aboutInputSchema, aboutMediaInputSchema } from '../../schemas/communityAbout.schema';
import { ABOUT_TEXT_FIELDS } from '../../types/communityAbout.types';
import { sanitizePlanContent } from '../../server/plan-content';
import { planWriteError, runPlanAction } from '../plans/_shared';

export async function saveCommunityAbout(input: unknown) {
  return runPlanAction(aboutInputSchema, input, 'content', async ({ client }, value) => {
    const patch = {
      ...Object.fromEntries(ABOUT_TEXT_FIELDS.map((field) => [field, sanitizePlanContent(value[field])])),
      founded_on: value.foundedOn, location: value.location, contact_email: value.contactEmail,
      contact_phone: value.contactPhone, website: value.website, social_links: value.socialLinks,
      is_published: value.isPublished,
    };
    const query = value.expectedVersion === undefined
      ? client.from('community_about').insert({ ...patch, id: value.id, community_id: value.communityId })
      : client.from('community_about').update(patch).eq('community_id', value.communityId)
        .eq('id', value.id).eq('version', value.expectedVersion);
    const { data, error } = await query.select('id,version').maybeSingle();
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    return { ok: true, data: data as { id: string; version: number } };
  });
}

export async function attachAboutMedia(input: unknown) {
  return runPlanAction(aboutMediaInputSchema, input, 'content', async ({ client }, value) => {
    const { error } = await client.from('community_about_media').upsert({
      id: value.id, community_id: value.communityId, about_id: value.aboutId, asset_id: value.assetId,
    }, { onConflict: 'about_id,asset_id', ignoreDuplicates: true });
    if (error) return { ok: false, error: planWriteError(error.code) };
    const { data, error: readError } = await client.from('community_about_media').select('id')
      .eq('community_id', value.communityId).eq('about_id', value.aboutId).eq('asset_id', value.assetId).maybeSingle();
    if (readError || !data) return { ok: false, error: 'No se pudo confirmar el archivo. Recarga la página.' };
    return { ok: true, data: data as { id: string } };
  });
}

export async function detachAboutMedia(input: unknown) {
  return runPlanAction(aboutMediaInputSchema.extend({ confirmed: z.literal(true) }), input, 'content', async ({ client }, value) => {
    const { error } = await client.from('community_about_media').delete().eq('community_id', value.communityId)
      .eq('about_id', value.aboutId).eq('asset_id', value.assetId).eq('id', value.id);
    if (error) return { ok: false, error: planWriteError(error.code) };
    return { ok: true, data: { id: value.id } };
  });
}
