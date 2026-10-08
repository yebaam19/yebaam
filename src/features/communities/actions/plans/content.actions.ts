'use server';

import { sanitizePlanContent } from '../../server/plan-content';
import { deletePlanItemSchema, movePlanItemSchema, planItemInputSchema } from '../../schemas/communityPlan.schema';
import { planWriteError, runPlanAction } from './_shared';

export async function savePlanItem(input: unknown) {
  return runPlanAction(planItemInputSchema, input, 'plans', async ({ client }, value) => {
    const table = value.kind === 'axis' ? 'community_plan_axes' : 'community_plan_points';
    const patch = {
      title: value.title, description: value.description, is_published: value.isPublished,
      // Media uses separate Cloudflare IDs, never embedded delivery URLs in HTML.
      ...(value.kind === 'point' ? {
        content: sanitizePlanContent(value.content),
      } : {}),
    };
    const query = value.expectedVersion === undefined
      ? client.from(table).insert({
        ...patch, id: value.id, community_id: value.communityId, section_id: value.sectionId,
        ...(value.kind === 'point' ? { axis_id: value.axisId } : {}),
      })
      : client.from(table).update(patch).eq('id', value.id)
        .eq('community_id', value.communityId).eq('section_id', value.sectionId)
        .eq('version', value.expectedVersion);
    const { data, error } = await query.select('id,version').maybeSingle();
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    return { ok: true, data: data as { id: string; version: number } };
  });
}

export async function deletePlanItem(input: unknown) {
  return runPlanAction(deletePlanItemSchema, input, 'plans', async ({ client }, value) => {
    const table = value.kind === 'axis' ? 'community_plan_axes' : 'community_plan_points';
    const { data, error } = await client.from(table).delete().eq('id', value.id)
      .eq('community_id', value.communityId).eq('section_id', value.sectionId)
      .eq('version', value.expectedVersion).select('id').maybeSingle();
    if (error) return { ok: false, error: planWriteError(error.code) };
    if (!data) return { ok: false, error: planWriteError('40001') };
    return { ok: true, data: { id: value.id } };
  });
}

export async function movePlanItem(input: unknown) {
  return runPlanAction(movePlanItemSchema, input, 'plans', async ({ client }, value) => {
    const { error } = await client.rpc('move_community_plan_item', {
      target_community: value.communityId, target_section: value.sectionId,
      entity_kind: value.kind, entity_id: value.id, expected_version: value.expectedVersion,
      destination_axis: value.destinationAxis, before_id: value.beforeId,
    });
    if (error) return { ok: false, error: planWriteError(error.code) };
    return { ok: true, data: { id: value.id } };
  });
}
