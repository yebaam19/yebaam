'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';
import { signImageDeliveryUrl } from '@/lib/cloudflare/images';
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

/** Resolve the Cloudflare-signed delivery URL for the ID document of a verification request.
 *  ID documents are uploaded with requireSignedURLs=true (or backfilled via the one-shot
 *  script), so we mint an HMAC-signed URL that expires in 15 minutes. RLS on `id_documents`
 *  restricts SELECT to platform_admins + owner, but `requireAdmin()` above narrows this caller
 *  to admins only. */
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
  return signImageDeliveryUrl(data.cf_image_id, { expirySeconds: 60 * 15 });
}
