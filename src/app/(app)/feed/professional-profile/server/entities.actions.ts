'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import type {
  Association,
  AssociationFormData,
  Experience,
  ExperienceFormData,
  Language,
  LanguageFormData,
  License,
  LicenseFormData,
  Skill,
  SkillFormData,
  Study,
  StudyFormData,
  Title,
  TitleFormData,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireOwner(profileId: string) {
  const authClient = await getServerClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth?.user) return { client: null, userId: null as string | null };

  const db = getServiceClient();
  const { data: owner } = await db
    .from('professional_profiles')
    .select('user_id')
    .eq('id', profileId)
    .maybeSingle();
  if (!owner || (owner as { user_id: string }).user_id !== auth.user.id) {
    return { client: null, userId: null };
  }
  return { client: db, userId: auth.user.id };
}

function revalidate() {
  revalidatePath('/feed/professional-profile/[username]', 'page');
}

function emptyToNull<T>(v: T | undefined | ''): T | null {
  return v === undefined || v === '' ? null : (v as T);
}

// ============================================================================
// TITLES
// ============================================================================

export async function addTitleAction(
  profileId: string,
  data: TitleFormData,
): Promise<ActionResult<Title>> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from('professional_profile_titles')
    .insert({
      professional_profile_id: profileId,
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar título' };
  revalidate();
  return {
    ok: true,
    data: {
      id: (row as { id: string }).id,
      professionalProfileId: profileId,
      name: (row as { name: string }).name,
      institution: (row as { institution: string | null }).institution,
      year: (row as { year: number | null }).year,
    },
  };
}

export async function updateTitleAction(
  profileId: string,
  titleId: string,
  data: TitleFormData,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_titles')
    .update({
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
    })
    .eq('id', titleId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteTitleAction(profileId: string, titleId: string): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_titles')
    .delete()
    .eq('id', titleId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ============================================================================
// STUDIES
// ============================================================================

export async function addStudyAction(
  profileId: string,
  data: StudyFormData,
): Promise<ActionResult<Study>> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from('professional_profile_studies')
    .insert({
      professional_profile_id: profileId,
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar estudio' };
  revalidate();
  return {
    ok: true,
    data: {
      id: (row as { id: string }).id,
      professionalProfileId: profileId,
      name: (row as { name: string }).name,
      institution: (row as { institution: string | null }).institution,
      year: (row as { year: number | null }).year,
    },
  };
}

export async function updateStudyAction(
  profileId: string,
  studyId: string,
  data: StudyFormData,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_studies')
    .update({
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
    })
    .eq('id', studyId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteStudyAction(profileId: string, studyId: string): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_studies')
    .delete()
    .eq('id', studyId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ============================================================================
// ASSOCIATIONS
// ============================================================================

export async function addAssociationAction(
  profileId: string,
  data: AssociationFormData,
): Promise<ActionResult<Association>> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from('professional_profile_associations')
    .insert({
      professional_profile_id: profileId,
      name: data.name,
      role: emptyToNull(data.role),
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar asociación' };
  revalidate();
  return {
    ok: true,
    data: {
      id: (row as { id: string }).id,
      professionalProfileId: profileId,
      name: (row as { name: string }).name,
      role: (row as { role: string | null }).role,
    },
  };
}

export async function updateAssociationAction(
  profileId: string,
  associationId: string,
  data: AssociationFormData,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_associations')
    .update({
      name: data.name,
      role: emptyToNull(data.role),
    })
    .eq('id', associationId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteAssociationAction(
  profileId: string,
  associationId: string,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_associations')
    .delete()
    .eq('id', associationId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ============================================================================
// LICENSES
// ============================================================================

export async function addLicenseAction(
  profileId: string,
  data: LicenseFormData,
): Promise<ActionResult<License>> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from('professional_profile_licenses')
    .insert({
      professional_profile_id: profileId,
      name: data.name,
      number: emptyToNull(data.number),
      issued_by: emptyToNull(data.issuedBy),
      issued_at: emptyToNull(data.issuedAt),
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar licencia' };
  revalidate();
  return {
    ok: true,
    data: {
      id: (row as { id: string }).id,
      professionalProfileId: profileId,
      name: (row as { name: string }).name,
      number: (row as { number: string | null }).number,
      issuedBy: (row as { issued_by: string | null }).issued_by,
      issuedAt: (row as { issued_at: string | null }).issued_at,
    },
  };
}

export async function updateLicenseAction(
  profileId: string,
  licenseId: string,
  data: LicenseFormData,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_licenses')
    .update({
      name: data.name,
      number: emptyToNull(data.number),
      issued_by: emptyToNull(data.issuedBy),
      issued_at: emptyToNull(data.issuedAt),
    })
    .eq('id', licenseId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteLicenseAction(
  profileId: string,
  licenseId: string,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_licenses')
    .delete()
    .eq('id', licenseId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ============================================================================
// SKILLS
// ============================================================================

export async function addSkillAction(
  profileId: string,
  data: SkillFormData,
): Promise<ActionResult<Skill>> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from('professional_profile_skills')
    .insert({
      professional_profile_id: profileId,
      name: data.name,
      level: emptyToNull(data.level),
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar habilidad' };
  revalidate();
  return {
    ok: true,
    data: {
      id: (row as { id: string }).id,
      professionalProfileId: profileId,
      name: (row as { name: string }).name,
      level: (row as { level: string | null }).level,
    },
  };
}

export async function updateSkillAction(
  profileId: string,
  skillId: string,
  data: SkillFormData,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_skills')
    .update({
      name: data.name,
      level: emptyToNull(data.level),
    })
    .eq('id', skillId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteSkillAction(profileId: string, skillId: string): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_skills')
    .delete()
    .eq('id', skillId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ============================================================================
// LANGUAGES
// ============================================================================

export async function addLanguageAction(
  profileId: string,
  data: LanguageFormData,
): Promise<ActionResult<Language>> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from('professional_profile_languages')
    .insert({
      professional_profile_id: profileId,
      name: data.name,
      proficiency: emptyToNull(data.proficiency),
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar idioma' };
  revalidate();
  return {
    ok: true,
    data: {
      id: (row as { id: string }).id,
      professionalProfileId: profileId,
      name: (row as { name: string }).name,
      proficiency: (row as { proficiency: string | null }).proficiency,
    },
  };
}

export async function updateLanguageAction(
  profileId: string,
  languageId: string,
  data: LanguageFormData,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_languages')
    .update({
      name: data.name,
      proficiency: emptyToNull(data.proficiency),
    })
    .eq('id', languageId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteLanguageAction(
  profileId: string,
  languageId: string,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_languages')
    .delete()
    .eq('id', languageId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ============================================================================
// EXPERIENCE
// ============================================================================

export async function addExperienceAction(
  profileId: string,
  data: ExperienceFormData,
): Promise<ActionResult<Experience>> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from('professional_profile_experience')
    .insert({
      professional_profile_id: profileId,
      position: data.position,
      company: emptyToNull(data.company),
      start_date: emptyToNull(data.startDate),
      end_date: emptyToNull(data.endDate),
      description: emptyToNull(data.description),
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar experiencia' };
  revalidate();
  return {
    ok: true,
    data: {
      id: (row as { id: string }).id,
      professionalProfileId: profileId,
      position: (row as { position: string }).position,
      company: (row as { company: string | null }).company,
      startDate: (row as { start_date: string | null }).start_date,
      endDate: (row as { end_date: string | null }).end_date,
      description: (row as { description: string | null }).description,
    },
  };
}

export async function updateExperienceAction(
  profileId: string,
  experienceId: string,
  data: ExperienceFormData,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_experience')
    .update({
      position: data.position,
      company: emptyToNull(data.company),
      start_date: emptyToNull(data.startDate),
      end_date: emptyToNull(data.endDate),
      description: emptyToNull(data.description),
    })
    .eq('id', experienceId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteExperienceAction(
  profileId: string,
  experienceId: string,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from('professional_profile_experience')
    .delete()
    .eq('id', experienceId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
