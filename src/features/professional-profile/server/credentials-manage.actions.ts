'use server';

import { revalidateProfile } from '@/app/(app)/(social)/professional-profile/server/entities.utils';
import { requireOwner } from '@/app/(app)/(social)/professional-profile/server/entities/_helpers';
import type {
CredentialTargetKind,
ProfessionalCredentialRequest,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import { ActionResult,revalidateAdminQueue } from './credentials-helpers';

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
