'use server';

import { emptyToNull } from '../entities.utils';
import { type AssociationRow, toAssociation } from '../entities.mappers';
import type { Association, AssociationFormData } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import { type ActionResult, ownedDelete, ownedInsert, ownedUpdate } from './_helpers';

export async function addAssociationAction(
  profileId: string,
  data: AssociationFormData,
): Promise<ActionResult<Association>> {
  return ownedInsert<AssociationRow, Association>(
    profileId,
    'professional_profile_associations',
    { name: data.name, role: emptyToNull(data.role) },
    toAssociation,
    'Error al agregar asociación',
  );
}

export async function updateAssociationAction(
  profileId: string,
  associationId: string,
  data: AssociationFormData,
): Promise<ActionResult> {
  return ownedUpdate(profileId, 'professional_profile_associations', associationId, {
    name: data.name,
    role: emptyToNull(data.role),
  });
}

export async function deleteAssociationAction(
  profileId: string,
  associationId: string,
): Promise<ActionResult> {
  return ownedDelete(profileId, 'professional_profile_associations', associationId);
}
