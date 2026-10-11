'use server';

import type {
FamilyRelationshipKind
} from '../types/family.types';
import { ActionResult,requireSession,revalidateFamilyPaths } from './families-helpers';

export async function linkRelationship(input: {
  familyId: string;
  personId: string;
  relatedPersonId: string;
  type: FamilyRelationshipKind;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { data, error } = await session.client
    .from('family_relationships')
    .insert({
      family_id: input.familyId,
      person_id: input.personId,
      related_person_id: input.relatedPersonId,
      relationship_type: input.type,
      created_by: session.userId,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear la relación.' };
  revalidateFamilyPaths();
  return { ok: true, data: { id: data.id } };
}

export async function unlinkRelationship(
  relationshipId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { error } = await session.client
    .from('family_relationships')
    .delete()
    .eq('id', relationshipId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: relationshipId } };
}
