'use server';
import { eventSchema, eventMutationSchema } from '../../schemas/communityEvent.schema';
import { runPlanAction, planWriteError } from '../plans/_shared';

function eventWriteError(code?: string) {
  return code === '23503' || code === '23514' ? 'Revisa las fechas y la imagen de portada seleccionada.' : planWriteError(code);
}

export async function saveCommunityEvent(input: unknown) {
  return runPlanAction(eventSchema, input, 'settings', async ({ client }, v) => {
    const patch = { title: v.title, description: v.description, starts_at: v.startsAt, ends_at: v.endsAt,
      location: v.location, virtual_url: v.virtualUrl, organizer: v.organizer, registration_info: v.registrationInfo,
      registration_url: v.registrationUrl, cover_asset_id: v.coverAssetId, rsvp_enabled: v.rsvpEnabled, is_published: v.isPublished };
    const { data: existing, error: readError } = await client.from('community_events').select('id,version,deleted_at,title,description,starts_at,ends_at,location,virtual_url,organizer,registration_info,registration_url,cover_asset_id,rsvp_enabled,is_published')
      .eq('community_id', v.communityId).eq('id', v.id).maybeSingle();
    if (readError) return { ok: false, error: eventWriteError(readError.code) };
    if (existing?.deleted_at) return { ok: false, error: 'El evento fue eliminado.' };
    const same = existing && Object.entries(patch).every(([key, value]) => key === 'starts_at' || key === 'ends_at'
      ? Date.parse(existing[key as keyof typeof patch]) === Date.parse(value as string) : existing[key as keyof typeof patch] === value);
    if (same) return { ok: true, data: { id: v.id } };
    if (existing ? existing.version !== v.expectedVersion : v.expectedVersion !== 0) return { ok: false, error: eventWriteError('40001') };
    if (!existing) {
      const { error } = await client.from('community_events').insert({ id: v.id, community_id: v.communityId, ...patch });
      if (error) return { ok: false, error: eventWriteError(error.code) };
    } else {
      const { data, error } = await client.from('community_events').update(patch).eq('community_id', v.communityId)
        .eq('id', v.id).eq('version', v.expectedVersion).is('deleted_at', null).select('id').maybeSingle();
      if (error || !data) return { ok: false, error: eventWriteError(error?.code ?? '40001') };
    }
    return { ok: true, data: { id: v.id } };
  });
}
export async function changeCommunityEvent(input: unknown) {
  return runPlanAction(eventMutationSchema, input, 'settings', async ({ client }, v) => {
    const { data: row, error: readError } = await client.from('community_events').select('id,version,is_cancelled,deleted_at')
      .eq('community_id', v.communityId).eq('id', v.id).maybeSingle();
    if (readError || !row) return { ok: false, error: 'No se encontró el evento.' };
    if ((v.operation === 'archive' && row.deleted_at) || (v.operation === 'cancel' && row.is_cancelled && !row.deleted_at)) return { ok: true, data: { id: v.id } };
    if (row.deleted_at || row.version !== v.expectedVersion) return { ok: false, error: eventWriteError('40001') };
    const patch = v.operation === 'archive' ? { deleted_at: new Date().toISOString() } : { is_cancelled: true };
    const { data, error } = await client.from('community_events').update(patch).eq('community_id', v.communityId)
      .eq('id', v.id).eq('version', v.expectedVersion).is('deleted_at', null).select('id').maybeSingle();
    if (error || !data) return { ok: false, error: eventWriteError(error?.code ?? '40001') };
    return { ok: true, data: { id: v.id } };
  });
}
