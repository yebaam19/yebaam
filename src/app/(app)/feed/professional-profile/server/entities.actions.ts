'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { emptyToNull, revalidateProfile } from './entities.utils';
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

export async function requireOwner(profileId: string) {
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
  revalidateProfile();
}

function norm(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase();
}

type TitleSnapshotFields = {
  name: string | null;
  category: string | null;
  distinction: string | null;
  institution: string | null;
  year: number | null;
};

type StudySnapshotFields = {
  name: string | null;
  study_type: string | null;
  institution: string | null;
  year: number | null;
};

function titleDrifted(prev: TitleSnapshotFields, next: TitleSnapshotFields): boolean {
  return (
    norm(prev.name) !== norm(next.name) ||
    (prev.category ?? '') !== (next.category ?? '') ||
    (prev.distinction ?? '') !== (next.distinction ?? '') ||
    norm(prev.institution) !== norm(next.institution) ||
    (prev.year ?? null) !== (next.year ?? null)
  );
}

function studyDrifted(prev: StudySnapshotFields, next: StudySnapshotFields): boolean {
  return (
    norm(prev.name) !== norm(next.name) ||
    (prev.study_type ?? '') !== (next.study_type ?? '') ||
    norm(prev.institution) !== norm(next.institution) ||
    (prev.year ?? null) !== (next.year ?? null)
  );
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

  const focuses = (data.focuses ?? []).map((f) => f.trim()).filter(Boolean).slice(0, 12);
  const { data: row, error } = await client
    .from('professional_profile_titles')
    .insert({
      professional_profile_id: profileId,
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
      category: emptyToNull(data.category ?? null),
      distinction: emptyToNull(data.distinction ?? null),
      focuses,
      institution_slug: emptyToNull(data.institutionSlug ?? null),
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar título' };
  revalidate();
  const r = row as Record<string, unknown>;
  return {
    ok: true,
    data: {
      id: r.id as string,
      professionalProfileId: profileId,
      name: r.name as string,
      institution: (r.institution as string | null) ?? null,
      year: (r.year as number | null) ?? null,
      category: (r.category as Title['category']) ?? null,
      distinction: (r.distinction as Title['distinction']) ?? null,
      focuses: ((r.focuses as string[] | null) ?? []),
      credentialStatus: (r.credential_status as Title['credentialStatus']) ?? 'none',
      credentialRequestId: (r.credential_request_id as string | null) ?? null,
      verifiedAt: (r.verified_at as string | null) ?? null,
      verifiedBy: (r.verified_by as string | null) ?? null,
      verifiedSnapshot: (r.verified_snapshot as Record<string, unknown> | null) ?? null,
      institutionPageId: (r.institution_page_id as string | null) ?? null,
      institutionSlug: (r.institution_slug as string | null) ?? null,
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

  // Snapshot the pre-update verified state so we can open a review_needed
  // request if a material field changes on an approved credential.
  const { data: prev } = await client
    .from('professional_profile_titles')
    .select(
      'id, name, category, distinction, institution, year, focuses, credential_status, verified_snapshot, diploma_cf_image_id, credential_request_id',
    )
    .eq('id', titleId)
    .eq('professional_profile_id', profileId)
    .maybeSingle();
  if (!prev) return { ok: false, error: 'Título no encontrado' };

  const focuses = (data.focuses ?? []).map((f) => f.trim()).filter(Boolean).slice(0, 12);
  const nextFields: TitleSnapshotFields = {
    name: data.name,
    category: data.category ?? null,
    distinction: data.distinction ?? null,
    institution: emptyToNull(data.institution) as string | null,
    year: data.year ?? null,
  };

  const { error } = await client
    .from('professional_profile_titles')
    .update({
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
      category: emptyToNull(data.category ?? null),
      distinction: emptyToNull(data.distinction ?? null),
      focuses,
      institution_slug: emptyToNull(data.institutionSlug ?? null),
    })
    .eq('id', titleId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };

  const prevRow = prev as {
    name: string | null;
    category: string | null;
    distinction: string | null;
    institution: string | null;
    year: number | null;
    credential_status: string;
    verified_snapshot: Record<string, unknown> | null;
    diploma_cf_image_id: string | null;
    credential_request_id: string | null;
  };
  const wasApproved = prevRow.credential_status === 'approved';
  const drifted = wasApproved && titleDrifted(prevRow, nextFields);
  if (drifted) {
    // The BEFORE UPDATE drift trigger has already flipped the row to
    // 'review_needed'. Open a corresponding review_needed request that
    // carries the prior verified snapshot + evidence so admins can compare.
    const evidenceId = prevRow.diploma_cf_image_id;
    if (evidenceId) {
      // Avoid duplicates if a review_needed request already exists for this title.
      const { data: existing } = await client
        .from('professional_credential_requests')
        .select('id')
        .eq('target_kind', 'title')
        .eq('title_id', titleId)
        .in('status', ['pending', 'review_needed'])
        .maybeSingle();
      if (!existing) {
        await client.from('professional_credential_requests').insert({
          user_id: userId,
          target_kind: 'title',
          title_id: titleId,
          evidence_cf_image_id: evidenceId,
          mime_type: null,
          submitted_snapshot:
            prevRow.verified_snapshot ?? {
              name: prevRow.name,
              category: prevRow.category,
              distinction: prevRow.distinction,
              institution: prevRow.institution,
              year: prevRow.year,
            },
          status: 'review_needed',
        });
      }
    }
    revalidatePath('/admin/professional-credentials');
  }

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

  const focuses = (data.focuses ?? []).map((f) => f.trim()).filter(Boolean).slice(0, 12);
  const { data: row, error } = await client
    .from('professional_profile_studies')
    .insert({
      professional_profile_id: profileId,
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
      study_type: emptyToNull(data.studyType ?? null),
      focuses,
      institution_slug: emptyToNull(data.institutionSlug ?? null),
    })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'Error al agregar estudio' };
  revalidate();
  const r = row as Record<string, unknown>;
  return {
    ok: true,
    data: {
      id: r.id as string,
      professionalProfileId: profileId,
      name: r.name as string,
      institution: (r.institution as string | null) ?? null,
      year: (r.year as number | null) ?? null,
      studyType: (r.study_type as Study['studyType']) ?? null,
      focuses: ((r.focuses as string[] | null) ?? []),
      credentialStatus: (r.credential_status as Study['credentialStatus']) ?? 'none',
      credentialRequestId: (r.credential_request_id as string | null) ?? null,
      verifiedAt: (r.verified_at as string | null) ?? null,
      verifiedBy: (r.verified_by as string | null) ?? null,
      verifiedSnapshot: (r.verified_snapshot as Record<string, unknown> | null) ?? null,
      institutionPageId: (r.institution_page_id as string | null) ?? null,
      institutionSlug: (r.institution_slug as string | null) ?? null,
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

  const { data: prev } = await client
    .from('professional_profile_studies')
    .select(
      'id, name, study_type, institution, year, focuses, credential_status, verified_snapshot, diploma_cf_image_id, credential_request_id',
    )
    .eq('id', studyId)
    .eq('professional_profile_id', profileId)
    .maybeSingle();
  if (!prev) return { ok: false, error: 'Estudio no encontrado' };

  const focuses = (data.focuses ?? []).map((f) => f.trim()).filter(Boolean).slice(0, 12);
  const nextFields: StudySnapshotFields = {
    name: data.name,
    study_type: data.studyType ?? null,
    institution: emptyToNull(data.institution) as string | null,
    year: data.year ?? null,
  };

  const { error } = await client
    .from('professional_profile_studies')
    .update({
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
      study_type: emptyToNull(data.studyType ?? null),
      focuses,
      institution_slug: emptyToNull(data.institutionSlug ?? null),
    })
    .eq('id', studyId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };

  const prevRow = prev as {
    name: string | null;
    study_type: string | null;
    institution: string | null;
    year: number | null;
    credential_status: string;
    verified_snapshot: Record<string, unknown> | null;
    diploma_cf_image_id: string | null;
    credential_request_id: string | null;
  };
  const wasApproved = prevRow.credential_status === 'approved';
  const drifted = wasApproved && studyDrifted(prevRow, nextFields);
  if (drifted) {
    const evidenceId = prevRow.diploma_cf_image_id;
    if (evidenceId) {
      const { data: existing } = await client
        .from('professional_credential_requests')
        .select('id')
        .eq('target_kind', 'study')
        .eq('study_id', studyId)
        .in('status', ['pending', 'review_needed'])
        .maybeSingle();
      if (!existing) {
        await client.from('professional_credential_requests').insert({
          user_id: userId,
          target_kind: 'study',
          study_id: studyId,
          evidence_cf_image_id: evidenceId,
          mime_type: null,
          submitted_snapshot:
            prevRow.verified_snapshot ?? {
              name: prevRow.name,
              study_type: prevRow.study_type,
              institution: prevRow.institution,
              year: prevRow.year,
            },
          status: 'review_needed',
        });
      }
    }
    revalidatePath('/admin/professional-credentials');
  }

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
