'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCommunityRoleGrants, requireCommunityOwner } from '../server/community-roles.server';
import {
  communityRoleCursorSchema, communityRoleRevokeSchema, communityRoleWriteSchema,
} from '../schemas/communityRole.schema';
import type { CommunityRolePage } from '../types/communityRole.types';
import type { ActionResult } from './_shared';

export async function getMoreCommunityRoles(input: {
  communityId: string; cursor: string | null;
}): Promise<ActionResult<CommunityRolePage>> {
  const scope = z.object({ communityId: z.uuid(), cursor: z.string().nullable() }).safeParse(input);
  if (!scope.success) return { ok: false, error: 'Página de roles inválida.' };
  try {
    if (scope.data.cursor) communityRoleCursorSchema.parse(JSON.parse(scope.data.cursor));
    return { ok: true, data: await getCommunityRoleGrants(scope.data.communityId, scope.data.cursor) };
  } catch {
    return { ok: false, error: 'No se pudieron cargar más roles.' };
  }
}

export async function saveCommunityRole(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = communityRoleWriteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa el usuario y el rol.' };
  const value = parsed.data;
  const owner = await requireCommunityOwner(value.communityId);
  if (!owner.ok) return { ok: false, error: owner.error };
  const client = owner.session.client;
  let targetUserId = value.userId;
  if (value.username) {
    const username = value.username.replace(/^@/, '');
    const { data: profile, error } = await client.from('profiles').select('id')
      .eq('username', username).maybeSingle();
    if (error || !profile) return { ok: false, error: 'No se encontró ese usuario.' };
    targetUserId = profile.id;
  }
  if (!targetUserId || targetUserId === owner.session.userId) {
    return { ok: false, error: 'Selecciona otro miembro de la comunidad.' };
  }
  const { data: member, error: memberError } = await client.from('community_members').select('user_id')
    .eq('community_id', value.communityId).eq('user_id', targetUserId).eq('status', 'active').maybeSingle();
  if (memberError || !member) return { ok: false, error: 'El usuario debe ser miembro activo.' };
  const { data: saved, error } = await client.from('community_profile_roles').upsert({
    community_id: value.communityId,
    user_id: targetUserId,
    role: value.role,
    can_edit_plans: value.role === 'editor' && value.canEditPlans,
  }, { onConflict: 'community_id,user_id' }).select('user_id').maybeSingle();
  if (error || !saved) return { ok: false, error: 'No se pudo guardar el rol.' };
  revalidatePath(`/feed/comunidades/${owner.slug}`, 'layout');
  return { ok: true, data: { userId: targetUserId } };
}

export async function revokeCommunityRole(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = communityRoleRevokeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Rol inválido.' };
  const owner = await requireCommunityOwner(parsed.data.communityId);
  if (!owner.ok) return { ok: false, error: owner.error };
  const { data, error } = await owner.session.client.from('community_profile_roles').delete()
    .eq('community_id', parsed.data.communityId).eq('user_id', parsed.data.userId)
    .select('user_id').maybeSingle();
  if (error || !data) return { ok: false, error: 'No se pudo revocar el rol.' };
  revalidatePath(`/feed/comunidades/${owner.slug}`, 'layout');
  return { ok: true, data: { userId: parsed.data.userId } };
}
