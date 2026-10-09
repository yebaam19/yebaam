'use server';

import { sectionInputSchema } from '../../schemas/communityPlan.schema';
import { planWriteError, runPlanAction } from './_shared';
import { z } from 'zod';

export async function importCommunityRules(input: unknown) {
  return runPlanAction(z.object({ communityId: z.uuid() }), input, 'settings', async ({ client }, value) => {
    const { data, error } = await client.rpc('import_community_plan_rules', { target_community: value.communityId });
    if (error) return { ok: false, error: planWriteError(error.code) };
    return { ok: true, data: { id: data as string } };
  });
}

export async function saveCommunitySection(input: unknown) {
  return runPlanAction(sectionInputSchema, input, 'settings', async ({ client }, value) => {
    const patch = {
      title: value.title, position: value.position, is_visible: value.isVisible,
      is_featured: value.isFeatured,
    };
    const query = value.expectedVersion === undefined
      ? client.from('community_sections').insert({
        ...patch, id: value.id, community_id: value.communityId, kind: value.kind,
      })
      : client.from('community_sections').update(patch)
        .eq('community_id', value.communityId).eq('id', value.id).eq('kind', value.kind)
        .eq('version', value.expectedVersion);
    const { data, error } = await query.select('id,version').maybeSingle();
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    return { ok: true, data: data as { id: string; version: number } };
  });
}
