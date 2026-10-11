'use server';

import { ActionResult,requireSession,revalidateFamilyPaths } from './families-helpers';

export async function removeMember(input: {
  familyId: string;
  profileId: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  // Cannot kick the owner.
  const { data: fam } = await session.client
    .from('families')
    .select('owner_id')
    .eq('id', input.familyId)
    .maybeSingle();
  if (!fam) return { ok: false, error: 'Familia no encontrada.' };
  if ((fam as { owner_id: string }).owner_id === input.profileId) {
    return { ok: false, error: 'No puedes expulsar al dueño. Transfiere la propiedad primero.' };
  }

  const { error } = await session.client
    .from('family_members')
    .delete()
    .eq('family_id', input.familyId)
    .eq('profile_id', input.profileId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: input.profileId } };
}

export async function leaveFamily(familyId: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { userId, client } = session;

  const { data: fam } = await client
    .from('families')
    .select('owner_id')
    .eq('id', familyId)
    .maybeSingle();
  if (!fam) return { ok: false, error: 'Familia no encontrada.' };
  if ((fam as { owner_id: string }).owner_id === userId) {
    return { ok: false, error: 'El dueño no puede abandonar su familia. Transfiere o elimina.' };
  }
  const { error } = await client
    .from('family_members')
    .delete()
    .eq('family_id', familyId)
    .eq('profile_id', userId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: familyId } };
}
