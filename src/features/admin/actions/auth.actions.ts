'use server'

import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getServerClient } from '@/utils/supabase/server'

export interface AdminLoginResult {
  ok: boolean
  error?: string
}

export async function adminLogin(formData: FormData): Promise<AdminLoginResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { ok: false, error: 'Credenciales incompletas.' }
  }

  const client = await getServerClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data?.user) {
    return { ok: false, error: 'Email o contraseña incorrectos.' }
  }

  // Verify the signed-in user is a platform admin
  const { data: staffRow } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (!staffRow) {
    await client.auth.signOut()
    return { ok: false, error: 'Esta cuenta no tiene acceso al panel de administración.' }
  }

  redirect('/admin' as Route)
}

export async function adminLogout(): Promise<void> {
  const client = await getServerClient()
  await client.auth.signOut()
  redirect('/admin/login' as Route)
}
