'use server';

import { emptyToNull } from '../entities.utils';
import { type LanguageRow, toLanguage } from '../entities.mappers';
import type { Language, LanguageFormData } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import { type ActionResult, ownedDelete, ownedInsert, ownedUpdate } from './_helpers';

export async function addLanguageAction(
  profileId: string,
  data: LanguageFormData,
): Promise<ActionResult<Language>> {
  return ownedInsert<LanguageRow, Language>(
    profileId,
    'professional_profile_languages',
    { name: data.name, proficiency: emptyToNull(data.proficiency) },
    toLanguage,
    'Error al agregar idioma',
  );
}

export async function updateLanguageAction(
  profileId: string,
  languageId: string,
  data: LanguageFormData,
): Promise<ActionResult> {
  return ownedUpdate(profileId, 'professional_profile_languages', languageId, {
    name: data.name,
    proficiency: emptyToNull(data.proficiency),
  });
}

export async function deleteLanguageAction(
  profileId: string,
  languageId: string,
): Promise<ActionResult> {
  return ownedDelete(profileId, 'professional_profile_languages', languageId);
}
