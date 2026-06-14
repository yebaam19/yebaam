'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/app/(app)/feed/professional-profile/server/entities/_helpers';
import { emptyToNull, revalidateProfile } from '@/app/(app)/feed/professional-profile/server/entities.utils';
import type {
  CredentialTargetKind,
  ProfessionalCredentialRequest,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function revalidateAdminQueue() {
  revalidatePath('/admin/professional-credentials');
}

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

interface CancelCredentialRequestInput {
  profileId: string;
  requestId: string;
}

export async function cancelCredentialRequestAction(
  input: CancelCredentialRequestInput,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(input.profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data: request } = await client
    .from('professional_credential_requests')
    .select('id, target_kind, title_id, study_id, status, user_id')
    .eq('id', input.requestId)
    .maybeSingle();
  if (!request) return { ok: false, error: 'Solicitud no encontrada' };

  const r = request as {
    id: string;
    target_kind: CredentialTargetKind;
    title_id: string | null;
    study_id: string | null;
    status: string;
    user_id: string;
  };
  if (r.user_id !== userId) return { ok: false, error: 'No autorizado' };
  if (r.status !== 'pending' && r.status !== 'review_needed') {
    return { ok: false, error: 'Solo solicitudes pendientes o en revisión se pueden cancelar.' };
  }

  // For review_needed, the row already had a prior verified_at — if so, restore
  // approved; otherwise (pending), reset to none.
  const tableName =
    r.target_kind === 'title' ? 'professional_profile_titles' : 'professional_profile_studies';
  const targetId = r.target_kind === 'title' ? r.title_id : r.study_id;
  if (targetId) {
    const { data: target } = await client
      .from(tableName)
      .select('verified_at, credential_status')
      .eq('id', targetId)
      .maybeSingle();
    const verifiedAt = (target as { verified_at: string | null } | null)?.verified_at ?? null;
    const restore = verifiedAt ? 'approved' : 'none';
    await client
      .from(tableName)
      .update({
        credential_status: restore,
        credential_request_id: null,
      })
      .eq('id', targetId);
  }

  const { error } = await client
    .from('professional_credential_requests')
    .delete()
    .eq('id', input.requestId);
  if (error) return { ok: false, error: error.message };

  revalidateProfile();
  revalidateAdminQueue();
  return { ok: true };
}

interface UploadDiplomaPhotoInput {
  profileId: string;
  target: CredentialTargetKind;
  targetId: string;
  cfImageId: string;
}

export async function uploadDiplomaPhotoAction(
  input: UploadDiplomaPhotoInput,
): Promise<ActionResult> {
  const { client, userId } = await requireOwner(input.profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const tableName =
    input.target === 'title' ? 'professional_profile_titles' : 'professional_profile_studies';

  const { data: row } = await client
    .from(tableName)
    .select('id, credential_status, professional_profile_id')
    .eq('id', input.targetId)
    .eq('professional_profile_id', input.profileId)
    .maybeSingle();
  if (!row) return { ok: false, error: 'No encontrado' };
  if ((row as { credential_status: string }).credential_status !== 'approved') {
    return { ok: false, error: 'Solo entradas verificadas pueden subir foto del diploma.' };
  }

  const { error } = await client
    .from(tableName)
    .update({ diploma_cf_image_id: input.cfImageId })
    .eq('id', input.targetId);
  if (error) return { ok: false, error: error.message };

  revalidateProfile();
  return { ok: true };
}

/**
 * Owner-only fetch of their own request rows for a profile (e.g. to render
 * status pills / rejection reasons in the credential dialog).
 */
export async function getMyCredentialRequestsAction(
  profileId: string,
): Promise<ActionResult<ProfessionalCredentialRequest[]>> {
  const { client, userId } = await requireOwner(profileId);
  if (!client || !userId) return { ok: false, error: 'No autorizado' };

  const { data, error } = await client
    .from('professional_credential_requests')
    .select(
      'id, user_id, target_kind, title_id, study_id, evidence_cf_image_id, mime_type, submitted_snapshot, status, submitted_at, reviewed_at, reviewed_by, admin_notes, rejection_reason',
    )
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });
  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as Array<{
    id: string;
    user_id: string;
    target_kind: CredentialTargetKind;
    title_id: string | null;
    study_id: string | null;
    evidence_cf_image_id: string;
    mime_type: string | null;
    submitted_snapshot: Record<string, unknown>;
    status: ProfessionalCredentialRequest['status'];
    submitted_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    admin_notes: string | null;
    rejection_reason: string | null;
  }>;

  return {
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      targetKind: r.target_kind,
      titleId: r.title_id,
      studyId: r.study_id,
      evidenceCfImageId: r.evidence_cf_image_id,
      mimeType: r.mime_type,
      submittedSnapshot: r.submitted_snapshot,
      status: r.status,
      submittedAt: r.submitted_at,
      reviewedAt: r.reviewed_at,
      reviewedBy: r.reviewed_by,
      adminNotes: r.admin_notes,
      rejectionReason: r.rejection_reason,
    })),
  };
}
