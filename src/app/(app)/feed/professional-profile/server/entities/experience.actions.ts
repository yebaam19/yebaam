'use server';

import { emptyToNull } from '../entities.utils';
import { type ExperienceRow, toExperience } from '../entities.mappers';
import type { Experience, ExperienceFormData } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import { type ActionResult, ownedDelete, ownedInsert, ownedUpdate } from './_helpers';

export async function addExperienceAction(
  profileId: string,
  data: ExperienceFormData,
): Promise<ActionResult<Experience>> {
  return ownedInsert<ExperienceRow, Experience>(
    profileId,
    'professional_profile_experience',
    {
      position: data.position,
      company: emptyToNull(data.company),
      start_date: emptyToNull(data.startDate),
      end_date: emptyToNull(data.endDate),
      description: emptyToNull(data.description),
    },
    toExperience,
    'Error al agregar experiencia',
  );
}

export async function updateExperienceAction(
  profileId: string,
  experienceId: string,
  data: ExperienceFormData,
): Promise<ActionResult> {
  return ownedUpdate(profileId, 'professional_profile_experience', experienceId, {
    position: data.position,
    company: emptyToNull(data.company),
    start_date: emptyToNull(data.startDate),
    end_date: emptyToNull(data.endDate),
    description: emptyToNull(data.description),
  });
}

export async function deleteExperienceAction(
  profileId: string,
  experienceId: string,
): Promise<ActionResult> {
  return ownedDelete(profileId, 'professional_profile_experience', experienceId);
}
