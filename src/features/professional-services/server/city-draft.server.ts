import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'

/** Only the verified session's owner sees the pending declaration. */
export const getMyCityServiceDraft = cache(async (serviceId: string) => {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return null
  const { data, error } = await client.from('professional_services')
    .select('id,name,admin_draft,provider_declaration_accepted_at')
    .eq('id', serviceId).eq('user_id', auth.user.id).maybeSingle()
  if (error) throw new Error('No se pudo comprobar la aceptación del servicio.')
  return data?.admin_draft && !data.provider_declaration_accepted_at ? data : null
})
