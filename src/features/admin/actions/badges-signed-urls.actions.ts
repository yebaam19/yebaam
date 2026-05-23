'use server'

import { getServerClient } from '@/utils/supabase/server'
import { signImageDeliveryUrl } from '@/lib/cloudflare/images'
import { requirePlatformAdmin } from '@/features/admin/server/auth'

/**
 * Admin-only: mints signed delivery URLs for the supporting documents
 * attached to a badge request. The underlying CF images were uploaded with
 * `requireSignedURLs: true`, so admins must mint a short-lived signed URL
 * each time the review dialog opens.
 */
export async function getBadgeRequestSupportingUrls(
  requestId: string,
): Promise<{ ok: true; data: string[] } | { ok: false; error: string }> {
  await requirePlatformAdmin()
  if (!requestId) return { ok: false, error: 'id_required' }

  const client = await getServerClient()
  const { data, error } = await client
    .from('badge_requests')
    .select('supporting_cf_image_ids')
    .eq('id', requestId)
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }

  const ids = (data.supporting_cf_image_ids as string[] | null) ?? []
  const urls = await Promise.all(
    ids.map(async (id) => {
      try {
        return await signImageDeliveryUrl(id, { expirySeconds: 60 * 15 })
      } catch (err) {
        console.error('[getBadgeRequestSupportingUrls.sign]', err)
        return ''
      }
    }),
  )
  return { ok: true, data: urls.filter(Boolean) }
}
