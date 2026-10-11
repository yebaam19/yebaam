'use server';

import { emptyToNull,revalidateProfile } from '@/app/(app)/(social)/professional-profile/server/entities.utils';
import { requireOwner } from '@/app/(app)/(social)/professional-profile/server/entities/_helpers';
import { ActionResult,revalidateAdminQueue } from './credentials-helpers';

interface SubmitTitleCredentialInput {
  profileId: string;
  titleId: string;
  cfImageId: string;
  mimeType?: string | null;
}

export async function submitTitleCredentialAction(
  input: SubmitTitleCredentialInput,
): Promise<ActionResult<{ requestId: string }>> {
  const { client, userId } = await requireOwner(input.profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: title } = await client
    .from('professional_profile_titles')
    .select('id, name, category, distinction, institution, year, focuses, credential_status, professional_profile_id')
    .eq('id', input.titleId)
    .eq('professional_profile_id', input.profileId)
    .maybeSingle();
  if (!title) return { ok: false, error: 'Título no encontrado' };

  const t = title as {
    id: string;
    name: string;
    category: string | null;
    distinction: string | null;
    institution: string | null;
    year: number | null;
    focuses: string[] | null;
    credential_status: string;
  };
  if (t.credential_status === 'pending' || t.credential_status === 'approved') {
    return { ok: false, error: 'Ya hay una solicitud activa o el título ya está verificado.' };
  }
  if (!t.category) {
    return { ok: false, error: 'Selecciona una categoría antes de autenticar.' };
  }

  const { data: inserted, error } = await client
    .from('professional_credential_requests')
    .insert({
      user_id: userId,
      target_kind: 'title',
      title_id: input.titleId,
      evidence_cf_image_id: input.cfImageId,
      mime_type: emptyToNull(input.mimeType ?? null),
      submitted_snapshot: {
        name: t.name,
        category: t.category,
        distinction: t.distinction,
        institution: t.institution,
        year: t.year,
        focuses: t.focuses ?? [],
      },
      status: 'pending',
    })
    .select('id')
    .maybeSingle();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'Error al enviar la solicitud' };
  }

  revalidateProfile();
  revalidateAdminQueue();
  return { ok: true, data: { requestId: (inserted as { id: string }).id } };
}

interface SubmitStudyCredentialInput {
  profileId: string;
  studyId: string;
  cfImageId: string;
  mimeType?: string | null;
}

export async function submitStudyCredentialAction(
  input: SubmitStudyCredentialInput,
): Promise<ActionResult<{ requestId: string }>> {
  const { client, userId } = await requireOwner(input.profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: study } = await client
    .from('professional_profile_studies')
    .select('id, name, study_type, institution, year, focuses, credential_status')
    .eq('id', input.studyId)
    .eq('professional_profile_id', input.profileId)
    .maybeSingle();
  if (!study) return { ok: false, error: 'Estudio no encontrado' };

  const s = study as {
    id: string;
    name: string;
    study_type: string | null;
    institution: string | null;
    year: number | null;
    focuses: string[] | null;
    credential_status: string;
  };
  if (s.credential_status === 'pending' || s.credential_status === 'approved') {
    return { ok: false, error: 'Ya hay una solicitud activa o el estudio ya está verificado.' };
  }
  if (!s.study_type) {
    return { ok: false, error: 'Selecciona un tipo de estudio antes de autenticar.' };
  }

  const { data: inserted, error } = await client
    .from('professional_credential_requests')
    .insert({
      user_id: userId,
      target_kind: 'study',
      study_id: input.studyId,
      evidence_cf_image_id: input.cfImageId,
      mime_type: emptyToNull(input.mimeType ?? null),
      submitted_snapshot: {
        name: s.name,
        study_type: s.study_type,
        institution: s.institution,
        year: s.year,
        focuses: s.focuses ?? [],
      },
      status: 'pending',
    })
    .select('id')
    .maybeSingle();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'Error al enviar la solicitud' };
  }

  revalidateProfile();
  revalidateAdminQueue();
  return { ok: true, data: { requestId: (inserted as { id: string }).id } };
}
