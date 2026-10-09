'use server';

import { communityThemeSchema } from '../schemas/communityTheme.schema';
import { planWriteError, runPlanAction } from './plans/_shared';

export async function saveCommunityTheme(input: unknown) {
  return runPlanAction(communityThemeSchema, input, 'settings', async ({ client }, value) => {
    const patch = { primary_color: value.primaryColor, secondary_color: value.secondaryColor };
    const query = value.expectedVersion === 0
      ? client.from('community_profile_theme').insert({ ...patch, community_id: value.communityId })
      : client.from('community_profile_theme').update(patch)
        .eq('community_id', value.communityId).eq('version', value.expectedVersion);
    const { data, error } = await query.select('id,version').maybeSingle();
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    return { ok: true, data: data as { id: string; version: number } };
  });
}
