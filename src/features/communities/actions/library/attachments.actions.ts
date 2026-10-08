'use server';

import { attachmentInputSchema, detachAttachmentSchema } from '../../schemas/communityLibrary.schema';
import { runPlanAction, planWriteError } from '../plans/_shared';

export async function attachLibraryAsset(input: unknown) {
  return runPlanAction(attachmentInputSchema, input, 'plans', async ({ client }, value) => {
    const { error } = await client.from('community_plan_attachments').upsert({
      id: value.id, community_id: value.communityId, point_id: value.pointId, asset_id: value.assetId, position: value.position,
    }, { onConflict: 'point_id,asset_id', ignoreDuplicates: true });
    if (error) return { ok: false, error: planWriteError(error.code) };
    const { data, error: readError } = await client.from('community_plan_attachments').select('id')
      .eq('community_id', value.communityId).eq('point_id', value.pointId).eq('asset_id', value.assetId).maybeSingle();
    if (readError || !data) return { ok: false, error: 'No se pudo confirmar el adjunto. Recarga la página.' };
    return { ok: true, data: data as { id: string } };
  });
}

export async function detachLibraryAsset(input: unknown) {
  return runPlanAction(detachAttachmentSchema, input, 'plans', async ({ client }, value) => {
    const { error } = await client.from('community_plan_attachments').delete()
      .eq('community_id', value.communityId).eq('point_id', value.pointId).eq('asset_id', value.assetId).eq('id', value.id);
    if (error) return { ok: false, error: planWriteError(error.code) };
    return { ok: true, data: { id: value.id } };
  });
}
