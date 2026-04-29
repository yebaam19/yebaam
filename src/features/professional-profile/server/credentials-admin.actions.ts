'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';

async function requireAdmin() {
  const sb = await getServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error('No autorizado');
  const { data: row } = await sb
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!row) throw new Error('Solo administradores pueden realizar esta acción');
  return { sb, adminId: auth.user.id };
}

interface ReviewInput {
  requestId: string;
  decision: 'approve' | 'reject';
  notes?: string | null;
  rejectionReason?: string | null;
}

export async function reviewCredentialRequestAction(input: ReviewInput) {
  const { sb, adminId } = await requireAdmin();

  // Re-read the target row inside the action so the admin's decision reflects
  // current state. The DB triggers fan out the status flip to the target row.
  const { data: req, error: readErr } = await sb
    .from('professional_credential_requests')
    .select('id, target_kind, title_id, study_id, status, submitted_snapshot')
    .eq('id', input.requestId)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!req) throw new Error('Solicitud no encontrada');

  const r = req as {
    id: string;
    target_kind: 'title' | 'study';
    title_id: string | null;
    study_id: string | null;
    status: string;
  };

  const newStatus = input.decision === 'approve' ? 'approved' : 'rejected';

  const { error } = await sb
    .from('professional_credential_requests')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      admin_notes: input.notes ?? null,
      rejection_reason: newStatus === 'rejected' ? (input.rejectionReason ?? null) : null,
    })
    .eq('id', input.requestId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/professional-credentials');
  // The owner's profile path is parameterized by username and not known here.
  // Use a layout-level revalidation so any visited profile re-renders.
  revalidatePath('/feed/professional-profile/[username]', 'layout');
}

/**
 * Material-edit decision for a `review_needed` request:
 * - 'preserve': admin confirms the new (edited) data — flip request to approved,
 *   trigger updates the target row's verified_snapshot.
 * - 'revoke':   admin determines the edit invalidated verification — flip to rejected,
 *   trigger clears verified_at on the target.
 */
export async function decideMaterialEditReviewAction(input: {
  requestId: string;
  decision: 'preserve' | 'revoke';
}) {
  const { sb, adminId } = await requireAdmin();

  const { data: req } = await sb
    .from('professional_credential_requests')
    .select('id, status, target_kind, title_id, study_id')
    .eq('id', input.requestId)
    .maybeSingle();
  if (!req) throw new Error('Solicitud no encontrada');
  if ((req as { status: string }).status !== 'review_needed') {
    throw new Error('Solo solicitudes en revisión por edición se pueden decidir aquí.');
  }

  const r = req as { id: string; target_kind: 'title' | 'study'; title_id: string | null; study_id: string | null };

  if (input.decision === 'preserve') {
    // Refresh submitted_snapshot to current target values so the verified
    // snapshot post-approval reflects what the admin actually preserved.
    const tableName =
      r.target_kind === 'title' ? 'professional_profile_titles' : 'professional_profile_studies';
    const targetId = r.target_kind === 'title' ? r.title_id : r.study_id;
    if (targetId) {
      const cols =
        r.target_kind === 'title'
          ? 'name, category, distinction, institution, year, focuses'
          : 'name, study_type, institution, year, focuses';
      const { data: current } = await sb.from(tableName).select(cols).eq('id', targetId).maybeSingle();
      if (current) {
        await sb
          .from('professional_credential_requests')
          .update({ submitted_snapshot: current })
          .eq('id', input.requestId);
      }
    }
    const { error } = await sb
      .from('professional_credential_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        admin_notes: 'Verificación preservada tras edición material.',
      })
      .eq('id', input.requestId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb
      .from('professional_credential_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        admin_notes: 'Verificación revocada tras edición material.',
        rejection_reason: 'Los cambios al título/estudio invalidaron la verificación previa.',
      })
      .eq('id', input.requestId);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/professional-credentials');
  revalidatePath('/feed/professional-profile/[username]', 'layout');
}

export async function getCredentialEvidenceUrlAction(requestId: string): Promise<string> {
  const { sb } = await requireAdmin();
  const { data, error } = await sb
    .from('professional_credential_requests')
    .select('evidence_cf_image_id')
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Solicitud no encontrada');
  const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  if (!hash) throw new Error('NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH is not set');
  return `https://imagedelivery.net/${hash}/${(data as { evidence_cf_image_id: string }).evidence_cf_image_id}/public`;
}
