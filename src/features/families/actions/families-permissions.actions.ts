'use server';

import type {
FamilyMemberRole,
SetMemberPermissionsDto
} from '../types/family.types';
import { ActionResult,requireSession,revalidateFamilyPaths } from './families-helpers';

export async function setMemberPermissions(
  dto: SetMemberPermissionsDto,
): Promise<ActionResult<{ profileId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const patch: Record<string, unknown> = {};
  if (dto.perms.canViewPersons !== undefined) patch.can_view_persons = dto.perms.canViewPersons;
  if (dto.perms.canViewEvents !== undefined) patch.can_view_events = dto.perms.canViewEvents;
  if (dto.perms.canViewPhotos !== undefined) patch.can_view_photos = dto.perms.canViewPhotos;
  if (dto.perms.canViewStories !== undefined) patch.can_view_stories = dto.perms.canViewStories;
  if (dto.perms.canViewDocuments !== undefined) patch.can_view_documents = dto.perms.canViewDocuments;
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No hay cambios.' };
  }

  // Upsert: si no existe la fila, crear; si existe, actualizar.
  const { error } = await session.client
    .from('family_member_permissions')
    .upsert(
      {
        family_id: dto.familyId,
        profile_id: dto.profileId,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'family_id,profile_id' },
    );
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { profileId: dto.profileId } };
}

export async function resetMemberPermissions(input: {
  familyId: string;
  profileId: string;
}): Promise<ActionResult<{ profileId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  // Borrar la fila → defaults (todos true) aplican vía can_member_view.
  const { error } = await session.client
    .from('family_member_permissions')
    .delete()
    .eq('family_id', input.familyId)
    .eq('profile_id', input.profileId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { profileId: input.profileId } };
}

export async function updateMemberRole(input: {
  familyId: string;
  profileId: string;
  role: Exclude<FamilyMemberRole, 'owner'>;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  // The owner role is only changed via transfer_family_ownership.
  const { data: fam } = await session.client
    .from('families')
    .select('owner_id')
    .eq('id', input.familyId)
    .maybeSingle();
  if (!fam) return { ok: false, error: 'Familia no encontrada.' };
  if ((fam as { owner_id: string }).owner_id === input.profileId) {
    return { ok: false, error: 'No puedes cambiar el rol del dueño.' };
  }

  const { error } = await session.client
    .from('family_members')
    .update({ role: input.role })
    .eq('family_id', input.familyId)
    .eq('profile_id', input.profileId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: input.profileId } };
}

export async function transferFamilyOwnership(input: {
  familyId: string;
  newOwnerProfileId: string;
}): Promise<ActionResult<{ familyId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { error } = await session.client.rpc('transfer_family_ownership', {
    p_family_id: input.familyId,
    p_new_owner_id: input.newOwnerProfileId,
  });
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { familyId: input.familyId } };
}
