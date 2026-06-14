'use server';

import { emptyToNull } from '../entities.utils';
import { type StudyRow, toStudy } from '../entities.mappers';
import type { Study, StudyFormData } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import {
  type ActionResult,
  type StudyDriftRow,
  type StudySnapshotFields,
  normFocuses,
  openCredentialDriftReview,
  ownedDelete,
  ownedInsert,
  requireOwner,
  revalidate,
  studyDrifted,
} from './_helpers';

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
