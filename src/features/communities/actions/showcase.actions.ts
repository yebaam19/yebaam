'use server';

import { showcaseSchema } from '../schemas/communityShowcase.schema';
import { runPlanAction, planWriteError } from './plans/_shared';

/** The RPC keeps publication, introduction and all four positions in one transaction. */
export async function saveCommunityShowcase(input: unknown) {
  return runPlanAction(showcaseSchema, input, 'content', async ({ client }, value) => {
    const { data, error } = await client.rpc('save_community_showcase', {
      target_community: value.communityId,
      expected_version: value.expectedVersion,
      introduction_text: value.introduction,
      publish_showcase: value.isPublished,
      video_assets: value.videoAssetIds,
    });
    if (error) return { ok: false, error: error.code === '23514'
      ? 'Uno de los videos ya no está disponible. Revisa la selección e inténtalo de nuevo.'
      : planWriteError(error.code) };
    return { ok: true, data: { version: data as number } };
  });
}
