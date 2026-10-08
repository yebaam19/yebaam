import 'server-only';
import type { Session } from '../_shared';
import { planWriteError } from '../plans/_shared';

type DirectoryTable = 'community_leaders' | 'community_leader_categories' | 'community_leader_contacts' | 'community_leader_media';
type Identity = { communityId: string; id: string; expectedVersion?: number };

export async function saveDirectoryRecord(client: Session['client'], table: DirectoryTable,
  value: Identity, patch: Record<string, unknown>) {
  const query = value.expectedVersion === undefined
    ? client.from(table).insert({ ...patch, community_id: value.communityId, id: value.id })
    : client.from(table).update(patch).eq('community_id', value.communityId).eq('id', value.id).eq('version', value.expectedVersion);
  const { data, error } = await query.select('id,version').maybeSingle();
  if (error) return { ok: false as const, error: planWriteError(error.code) };
  if (!data) return { ok: false as const, error: planWriteError('40001') };
  return { ok: true as const, data: data as { id: string; version: number } };
}

export async function deleteDirectoryRecord(client: Session['client'], table: DirectoryTable,
  value: Identity & { expectedVersion: number }) {
  const { data, error } = await client.from(table).delete().eq('community_id', value.communityId)
    .eq('id', value.id).eq('version', value.expectedVersion).select('id').maybeSingle();
  if (error?.code === '23503') return { ok: false as const, error: 'Mueve los integrantes a otra categoría antes de eliminarla.' };
  if (error) return { ok: false as const, error: planWriteError(error.code) };
  if (!data) return { ok: false as const, error: planWriteError('40001') };
  return { ok: true as const, data: data as { id: string } };
}
