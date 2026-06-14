'use server';

import { emptyToNull } from '../entities.utils';
import { type TitleRow, toTitle } from '../entities.mappers';
import type { Title, TitleFormData } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import {
  type ActionResult,
  type TitleDriftRow,
  type TitleSnapshotFields,
  normFocuses,
  openCredentialDriftReview,
  ownedDelete,
  ownedInsert,
  requireOwner,
  revalidate,
  titleDrifted,
} from './_helpers';

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
