'use server';

import { emptyToNull } from '../entities.utils';
import { type SkillRow, toSkill } from '../entities.mappers';
import type { Skill, SkillFormData } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import { type ActionResult, ownedDelete, ownedInsert, ownedUpdate } from './_helpers';

export async function addSkillAction(
  profileId: string,
  data: SkillFormData,
): Promise<ActionResult<Skill>> {
  return ownedInsert<SkillRow, Skill>(
    profileId,
    'professional_profile_skills',
    { name: data.name, level: emptyToNull(data.level) },
    toSkill,
    'Error al agregar habilidad',
  );
}

export async function updateSkillAction(
  profileId: string,
  skillId: string,
  data: SkillFormData,
): Promise<ActionResult> {
  return ownedUpdate(profileId, 'professional_profile_skills', skillId, {
    name: data.name,
    level: emptyToNull(data.level),
  });
}

export async function deleteSkillAction(profileId: string, skillId: string): Promise<ActionResult> {
  return ownedDelete(profileId, 'professional_profile_skills', skillId);
}
