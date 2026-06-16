'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { userId: data.user.id, client }
}

export async function addBusinessAdmin(businessId: string, email: string) {
  const { client } = await requireSession()
  const { data, error } = await client.rpc('comidas_add_business_admin', {
    p_business_id: businessId,
    p_email:       email.toLowerCase().trim(),
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/negocios/admin/${businessId}/administradores`)
  return data as string
}

export async function removeBusinessAdmin(businessId: string, adminUserId: string) {
  const { client } = await requireSession()
  const { error } = await client.rpc('comidas_remove_business_admin', {
    p_business_id:   businessId,
    p_admin_user_id: adminUserId,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/negocios/admin/${businessId}/administradores`)
}
