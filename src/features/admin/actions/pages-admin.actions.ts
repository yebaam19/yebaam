'use server'

import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/utils/supabase/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'

export async function setPageVerified(input: {
  pageId: string
  verified: boolean
}): Promise<{ ok: boolean; error?: string }> {
  await requirePlatformAdmin()
  const client = getServiceClient()
  const { error } = await client
    .from('pages')
    .update({
      is_verified: input.verified,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.pageId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/paginas')
  return { ok: true }
}

export async function softRestrictPage(input: {
  pageId: string
}): Promise<{ ok: boolean; error?: string }> {
  await requirePlatformAdmin()
  const client = getServiceClient()
  const { error } = await client
    .from('pages')
    .update({ privacy: 'restricted', updated_at: new Date().toISOString() })
    .eq('id', input.pageId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/paginas')
  return { ok: true }
}
