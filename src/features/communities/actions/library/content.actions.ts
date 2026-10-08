'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { assetMetadataSchema, deleteAssetSchema, finalizeAssetSchema, folderInputSchema } from '../../schemas/communityLibrary.schema';
import { validateAssetUpload } from '../../server/asset-validation.server';
import { scheduleAssetCleanup } from '../../server/schedule-asset-cleanup.server';
import { runPlanAction, planWriteError } from '../plans/_shared';

export async function finalizeLibraryAsset(input: unknown) {
  return runPlanAction(finalizeAssetSchema, input, 'content', async ({ userId }, value) => {
    const verified = await validateAssetUpload(userId, value);
    // Permission verified above; only the server can persist remote identifiers.
    const service = getServiceClient();
    const { data, error } = await service.rpc('finalize_community_asset', {
      target_community: value.communityId, actor: userId, upload_id: value.id, asset_kind: value.kind,
      remote_id: verified.mediaId, original_name: verified.fileName, mime_type: verified.contentType,
      asset_title: value.title, byte_size: verified.sizeBytes, duration: verified.duration,
      replace_id: value.replaceId ?? null, expected_version: value.expectedVersion ?? null,
    });
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (value.replaceId) scheduleAssetCleanup();
    return { ok: true, data: data as { id: string; version: number } };
  // The upload queue refreshes once it closes; an RSC replacement mid-batch
  // would discard the remaining files and remote IDs needed for safe retries.
  }, { revalidate: false });
}

export async function saveLibraryAsset(input: unknown) {
  return runPlanAction(assetMetadataSchema, input, 'content', async ({ client }, value) => {
    const { data, error } = await client.from('community_library_assets').update({
      title: value.title, description: value.description, folder_id: value.folderId,
      visibility: value.visibility, is_published: value.isPublished,
    }).eq('community_id', value.communityId).eq('id', value.id).eq('version', value.expectedVersion)
      .select('id,version').maybeSingle();
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    return { ok: true, data: data as { id: string; version: number } };
  });
}

export async function saveAssetFolder(input: unknown) {
  return runPlanAction(folderInputSchema, input, 'content', async ({ client }, value) => {
    const patch = { title: value.title, is_visible: value.isVisible };
    const query = value.expectedVersion === undefined
      ? client.from('community_asset_folders').insert({ ...patch, id: value.id, community_id: value.communityId, kind: value.kind })
      : client.from('community_asset_folders').update(patch).eq('id', value.id)
        .eq('community_id', value.communityId).eq('version', value.expectedVersion);
    const { data, error } = await query.select('id,version').maybeSingle();
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    return { ok: true, data: data as { id: string; version: number } };
  });
}

export async function deleteLibraryAsset(input: unknown) {
  return runPlanAction(deleteAssetSchema, input, 'content', async ({ client }, value) => {
    const { data, error } = await client.from('community_library_assets').update({ deleted_at: new Date().toISOString() })
      .eq('community_id', value.communityId).eq('id', value.id).eq('version', value.expectedVersion)
      .select('id').maybeSingle();
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    scheduleAssetCleanup();
    return { ok: true, data: { id: value.id } };
  });
}

export async function deleteAssetFolder(input: unknown) {
  return runPlanAction(deleteAssetSchema, input, 'content', async ({ client }, value) => {
    const { data, error } = await client.from('community_asset_folders').delete()
      .eq('community_id', value.communityId).eq('id', value.id).eq('version', value.expectedVersion)
      .select('id').maybeSingle();
    if (error?.code === '23503') return { ok: false, error: 'Mueve los archivos a otra carpeta antes de eliminar esta.' };
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    return { ok: true, data: { id: value.id } };
  });
}
