'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { emptyToNull, revalidateProfile } from './entities.utils';
import {
  type AssociationRow,
  type ExperienceRow,
  type LanguageRow,
  type LicenseRow,
  type SkillRow,
  type StudyRow,
  type TitleRow,
  toAssociation,
  toExperience,
  toLanguage,
  toLicense,
  toSkill,
  toStudy,
  toTitle,
} from './entities.mappers';
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

/**
 * Resolve the service-role client IF the authenticated user owns `profileId`.
 * Returns `{ client: null }` for anonymous callers or non-owners — every action
 * below rejects on that with `'No autorizado'`. Exported because
 * `credentials.actions.ts` reuses the same ownership gate.
 */
export async function requireOwner(
  profileId: string,
): Promise<{ client: SupabaseClient | null; userId: string | null }> {
  const authClient = await getServerClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth?.user) return { client: null, userId: null };

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

function normFocuses(focuses: string[] | null | undefined): string[] {
  return (focuses ?? []).map((f) => f.trim()).filter(Boolean).slice(0, 12);
}

// ---------------------------------------------------------------------------
// Generic owner-gated mutators. Each child entity's add/update/delete is a thin
// wrapper over these — the only per-entity bits are the table, the column
// payload, and (for add) the row→domain mapper.
// ---------------------------------------------------------------------------

async function ownedInsert<Row, T>(
  profileId: string,
  table: string,
  values: Record<string, unknown>,
  map: (row: Row) => T,
  errorLabel: string,
): Promise<ActionResult<T>> {
  const { client } = await requireOwner(profileId);
  if (!client) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from(table)
    .insert({ professional_profile_id: profileId, ...values })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? errorLabel };
  revalidate();
  return { ok: true, data: map(row as Row) };
}

async function ownedUpdate(
  profileId: string,
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<ActionResult> {
  const { client } = await requireOwner(profileId);
  if (!client) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from(table)
    .update(patch)
    .eq('id', id)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

async function ownedDelete(
  profileId: string,
  table: string,
  id: string,
): Promise<ActionResult> {
  const { client } = await requireOwner(profileId);
  if (!client) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from(table)
    .delete()
    .eq('id', id)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Credential drift (titles + studies only). When a material field changes on an
// already-approved credential, a BEFORE UPDATE trigger flips the row to
// 'review_needed'; we mirror that by opening a review request carrying the prior
// verified snapshot + evidence so admins can compare.
// ---------------------------------------------------------------------------

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

type DriftRow = {
  name: string | null;
  institution: string | null;
  year: number | null;
  credential_status: string;
  verified_snapshot: Record<string, unknown> | null;
  diploma_cf_image_id: string | null;
};
type TitleDriftRow = DriftRow & { category: string | null; distinction: string | null };
type StudyDriftRow = DriftRow & { study_type: string | null };

async function openCredentialDriftReview(
  client: SupabaseClient,
  opts: {
    kind: 'title' | 'study';
    idColumn: 'title_id' | 'study_id';
    rowId: string;
    userId: string;
    diplomaCfImageId: string | null;
    verifiedSnapshot: Record<string, unknown> | null;
    fallbackSnapshot: Record<string, unknown>;
  },
): Promise<void> {
  // No evidence on file → nothing to attach, but the admin queue still needs to
  // know the row drifted, so revalidate below regardless.
  if (opts.diplomaCfImageId) {
    const { data: existing } = await client
      .from('professional_credential_requests')
      .select('id')
      .eq('target_kind', opts.kind)
      .eq(opts.idColumn, opts.rowId)
      .in('status', ['pending', 'review_needed'])
      .maybeSingle();
    if (!existing) {
      await client.from('professional_credential_requests').insert({
        user_id: opts.userId,
        target_kind: opts.kind,
        [opts.idColumn]: opts.rowId,
        evidence_cf_image_id: opts.diplomaCfImageId,
        mime_type: null,
        submitted_snapshot: opts.verifiedSnapshot ?? opts.fallbackSnapshot,
        status: 'review_needed',
      });
    }
  }
  revalidatePath('/admin/professional-credentials');
}

// ============================================================================
// TITLES
// ============================================================================

export async function addTitleAction(
  profileId: string,
  data: TitleFormData,
): Promise<ActionResult<Title>> {
  return ownedInsert<TitleRow, Title>(
    profileId,
    'professional_profile_titles',
    {
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
      category: emptyToNull(data.category ?? null),
      distinction: emptyToNull(data.distinction ?? null),
      focuses: normFocuses(data.focuses),
      institution_slug: emptyToNull(data.institutionSlug ?? null),
    },
    toTitle,
    'Error al agregar título',
  );
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
      focuses: normFocuses(data.focuses),
      institution_slug: emptyToNull(data.institutionSlug ?? null),
    })
    .eq('id', titleId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };

  const prevRow = prev as TitleDriftRow;
  if (prevRow.credential_status === 'approved' && titleDrifted(prevRow, nextFields)) {
    await openCredentialDriftReview(client, {
      kind: 'title',
      idColumn: 'title_id',
      rowId: titleId,
      userId,
      diplomaCfImageId: prevRow.diploma_cf_image_id,
      verifiedSnapshot: prevRow.verified_snapshot,
      fallbackSnapshot: {
        name: prevRow.name,
        category: prevRow.category,
        distinction: prevRow.distinction,
        institution: prevRow.institution,
        year: prevRow.year,
      },
    });
  }

  revalidate();
  return { ok: true };
}

export async function deleteTitleAction(profileId: string, titleId: string): Promise<ActionResult> {
  return ownedDelete(profileId, 'professional_profile_titles', titleId);
}

// ============================================================================
// STUDIES
// ============================================================================

export async function addStudyAction(
  profileId: string,
  data: StudyFormData,
): Promise<ActionResult<Study>> {
  return ownedInsert<StudyRow, Study>(
    profileId,
    'professional_profile_studies',
    {
      name: data.name,
      institution: emptyToNull(data.institution),
      year: data.year ?? null,
      study_type: emptyToNull(data.studyType ?? null),
      focuses: normFocuses(data.focuses),
      institution_slug: emptyToNull(data.institutionSlug ?? null),
    },
    toStudy,
    'Error al agregar estudio',
  );
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
      focuses: normFocuses(data.focuses),
      institution_slug: emptyToNull(data.institutionSlug ?? null),
    })
    .eq('id', studyId)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };

  const prevRow = prev as StudyDriftRow;
  if (prevRow.credential_status === 'approved' && studyDrifted(prevRow, nextFields)) {
    await openCredentialDriftReview(client, {
      kind: 'study',
      idColumn: 'study_id',
      rowId: studyId,
      userId,
      diplomaCfImageId: prevRow.diploma_cf_image_id,
      verifiedSnapshot: prevRow.verified_snapshot,
      fallbackSnapshot: {
        name: prevRow.name,
        study_type: prevRow.study_type,
        institution: prevRow.institution,
        year: prevRow.year,
      },
    });
  }

  revalidate();
  return { ok: true };
}

export async function deleteStudyAction(profileId: string, studyId: string): Promise<ActionResult> {
  return ownedDelete(profileId, 'professional_profile_studies', studyId);
}

// ============================================================================
// ASSOCIATIONS
// ============================================================================

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

// ============================================================================
// LICENSES
// ============================================================================

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

// ============================================================================
// SKILLS
// ============================================================================

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

// ============================================================================
// LANGUAGES
// ============================================================================

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

// ============================================================================
// EXPERIENCE
// ============================================================================

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
