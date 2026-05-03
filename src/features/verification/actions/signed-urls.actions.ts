'use server';

import { getServerClient } from '@/utils/supabase/server';
import { signImageDeliveryUrl } from '@/lib/cloudflare/images';

async function isPlatformAdminFor(userId: string): Promise<boolean> {
  const sb = await getServerClient();
  const { data } = await sb
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

/** Returns signed delivery URLs for the caller's own verification photos.
 *  RLS already restricts the underlying SELECT to owner+admin, so passing the
 *  caller's session through getServerClient() handles authorization. */
export async function getOwnVerificationPhotoUrlsAction(): Promise<{ slot: number; url: string }[]> {
  const sb = await getServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error('No autorizado');

  const { data: rows, error } = await sb
    .from('verification_photos')
    .select('slot, cf_image_id')
    .eq('user_id', auth.user.id)
    .order('slot');
  if (error) throw new Error(error.message);

  return Promise.all(
    (rows ?? []).map(async (r) => ({
      slot: r.slot,
      url: await signImageDeliveryUrl(r.cf_image_id, { expirySeconds: 60 * 15 }),
    })),
  );
}

/** Returns the signed delivery URL for the caller's most recent ID document.
 *  RLS on id_documents restricts SELECT to owner+admin. */
export async function getOwnIdDocumentUrlAction(): Promise<string | null> {
  const sb = await getServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error('No autorizado');

  const { data, error } = await sb
    .from('id_documents')
    .select('cf_image_id')
    .eq('user_id', auth.user.id)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return signImageDeliveryUrl(data.cf_image_id, { expirySeconds: 60 * 15 });
}

/** Admin-only: signed URL for a specific user's verification photos by user_id.
 *  Used by the admin verification queue. */
export async function getVerificationPhotoUrlsForAdmin(
  userId: string,
): Promise<{ slot: number; url: string }[]> {
  const sb = await getServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error('No autorizado');
  if (!(await isPlatformAdminFor(auth.user.id))) {
    throw new Error('Solo administradores');
  }

  const { data: rows, error } = await sb
    .from('verification_photos')
    .select('slot, cf_image_id')
    .eq('user_id', userId)
    .order('slot');
  if (error) throw new Error(error.message);

  return Promise.all(
    (rows ?? []).map(async (r) => ({
      slot: r.slot,
      url: await signImageDeliveryUrl(r.cf_image_id, { expirySeconds: 60 * 15 }),
    })),
  );
}

/** Admin-only: signed URL for the ID document attached to a verification request. */
export async function getIdDocumentUrlForAdmin(requestId: string): Promise<string | null> {
  const sb = await getServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error('No autorizado');
  if (!(await isPlatformAdminFor(auth.user.id))) {
    throw new Error('Solo administradores');
  }

  const { data, error } = await sb
    .from('id_documents')
    .select('cf_image_id')
    .eq('request_id', requestId)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return signImageDeliveryUrl(data.cf_image_id, { expirySeconds: 60 * 15 });
}
