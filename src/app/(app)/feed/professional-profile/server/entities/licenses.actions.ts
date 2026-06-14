'use server';

import { emptyToNull } from '../entities.utils';
import { type LicenseRow, toLicense } from '../entities.mappers';
import type { License, LicenseFormData } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import { type ActionResult, ownedDelete, ownedInsert, ownedUpdate } from './_helpers';

export async function addLicenseAction(
  profileId: string,
  data: LicenseFormData,
): Promise<ActionResult<License>> {
  return ownedInsert<LicenseRow, License>(
    profileId,
    'professional_profile_licenses',
    {
      name: data.name,
      number: emptyToNull(data.number),
      issued_by: emptyToNull(data.issuedBy),
      issued_at: emptyToNull(data.issuedAt),
    },
    toLicense,
    'Error al agregar licencia',
  );
}

export async function updateLicenseAction(
  profileId: string,
  licenseId: string,
  data: LicenseFormData,
): Promise<ActionResult> {
  return ownedUpdate(profileId, 'professional_profile_licenses', licenseId, {
    name: data.name,
    number: emptyToNull(data.number),
    issued_by: emptyToNull(data.issuedBy),
    issued_at: emptyToNull(data.issuedAt),
  });
}

export async function deleteLicenseAction(
  profileId: string,
  licenseId: string,
): Promise<ActionResult> {
  return ownedDelete(profileId, 'professional_profile_licenses', licenseId);
}
