import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { requireSession } from '../actions/_shared';
import { communityRoleCursorSchema } from '../schemas/communityRole.schema';
import type { CommunityRoleGrant, CommunityRolePage } from '../types/communityRole.types';

const PAGE_SIZE = 25;
type RoleRow = { user_id: string; role: CommunityRoleGrant['role']; can_edit_plans: boolean; created_at: string };
type ProfileRow = { id: string; username: string | null; display_name: string | null };

export const requireCommunityOwner = cache(async (communityId: string) => {
  z.uuid().parse(communityId);
  const session = await requireSession();
  if (!session) return { ok: false as const, error: 'Debes iniciar sesión.' };
  const { data, error } = await session.client.from('communities').select('owner_id,slug')
    .eq('id', communityId).maybeSingle();
  if (error || !data || data.owner_id !== session.userId) {
    return { ok: false as const, error: 'Solo el propietario puede gestionar los roles.' };
  }
  return { ok: true as const, session, slug: data.slug as string };
});

export async function getCommunityRoleGrants(communityId: string, cursorJson: string | null = null): Promise<CommunityRolePage> {
  const owner = await requireCommunityOwner(communityId);
  if (!owner.ok) throw new Error(owner.error);
  const cursor = cursorJson ? communityRoleCursorSchema.parse(JSON.parse(cursorJson)) : null;
  let query = owner.session.client.from('community_profile_roles')
    .select('user_id,role,can_edit_plans,created_at').eq('community_id', communityId)
    .order('created_at', { ascending: false }).order('user_id', { ascending: false }).limit(PAGE_SIZE + 1);
  if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},user_id.lt.${cursor.userId})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar los roles.');
  const rows = (data ?? []) as RoleRow[];
  const page = rows.slice(0, PAGE_SIZE);
  const ids = page.map((row) => row.user_id);
  const { data: profiles, error: profilesError } = ids.length
    ? await owner.session.client.from('profiles').select('id,username,display_name').in('id', ids)
    : { data: [], error: null };
  if (profilesError) throw new Error('No se pudieron cargar los perfiles delegados.');
  const byId = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  const last = page.at(-1);
  return {
    items: page.map((row) => ({
      userId: row.user_id,
      username: byId.get(row.user_id)?.username ?? '',
      displayName: byId.get(row.user_id)?.display_name || byId.get(row.user_id)?.username || 'Usuario',
      role: row.role,
      canEditPlans: row.can_edit_plans,
      createdAt: row.created_at,
    })),
    nextCursor: rows.length > PAGE_SIZE && last
      ? JSON.stringify({ createdAt: last.created_at, userId: last.user_id }) : null,
  };
}
