'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';
import { adminReviewSchema } from '../validators/verification.schemas';

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

export async function reviewVerificationRequestAction(input: {
  requestId: string;
  decision: 'approved' | 'rejected';
  notes?: string | null;
  rejectionReason?: string | null;
}) {
  const parsed = adminReviewSchema.parse(input);
  const { sb, adminId } = await requireAdmin();

  // An admin must not review their own verification request — verified status
  // is a public trust signal and requires an independent reviewer. RLS only
  // checks `is_platform_admin()`, so this guard has to live here.
  const { data: target, error: targetErr } = await sb
    .from('verification_requests')
    .select('user_id')
    .eq('id', parsed.requestId)
    .maybeSingle();
  if (targetErr) throw new Error(targetErr.message);
  if (!target) throw new Error('Solicitud no encontrada');
  if ((target as { user_id: string }).user_id === adminId) {
    throw new Error('No puedes revisar tu propia solicitud de verificación');
  }

  const { error } = await sb
    .from('verification_requests')
    .update({
      status: parsed.decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      admin_notes: parsed.notes ?? null,
      rejection_reason: parsed.decision === 'rejected' ? (parsed.rejectionReason ?? null) : null,
    })
    .eq('id', parsed.requestId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/verifications');
}

/** Resolve the Cloudflare delivery URL for the ID document of a verification request.
 *  Privacy model: RLS on `id_documents` already restricts SELECT to platform_admins,
 *  so non-admins can never discover the `cf_image_id`. The id itself is an unguessable
 *  Cloudflare-generated identifier, so the public delivery URL is effectively admin-only. */
export async function getIdDocumentSignedUrlAction(requestId: string): Promise<string> {
  const { sb } = await requireAdmin();
  const { data, error } = await sb
    .from('id_documents')
    .select('cf_image_id')
    .eq('request_id', requestId)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Documento no encontrado');
  const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  if (!hash) throw new Error('NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH is not set');
  return `https://imagedelivery.net/${hash}/${data.cf_image_id}/public`;
}
