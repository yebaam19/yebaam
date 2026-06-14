import { revalidatePath } from 'next/cache'

import { getServerClient } from '@/utils/supabase/server'
import { findSubcategoryById } from '../data/service-categories-taxonomy'
import { professionalServicePath } from '../constants/routes'
import { slugify } from './service-action.helpers'

type ServerClient = Awaited<ReturnType<typeof getServerClient>>

export async function requireSession(): Promise<{ userId: string; client: ServerClient }> {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('Inicia sesión para continuar.')
  return { userId: data.user.id, client }
}

export async function uniqueServiceSlug(client: ServerClient, name: string): Promise<string> {
  const base = slugify(name)
  let candidate = base
  for (let i = 0; i < 25; i++) {
    const { data } = await client.from('professional_services').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${i + 2}`
  }
  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}

export async function insertSubcategories(
  client: ServerClient,
  serviceId: string,
  subcategoryIds: string[] | undefined,
  categoryId: string | undefined,
): Promise<void> {
  const ids = (subcategoryIds ?? []).filter(Boolean)
  if (ids.length === 0) return
  const rows = ids.map((subId) => {
    const sub = findSubcategoryById(subId)
    return {
      service_id: serviceId,
      subcategory_id: subId,
      subcategory_name: sub?.name ?? subId,
      category_id: sub?.parentId ?? categoryId ?? null,
    }
  })
  await client.from('professional_service_subcategories').insert(rows)
}

export function revalidateService(slug?: string) {
  revalidatePath('/professional-services')
  if (slug) revalidatePath(professionalServicePath(slug))
}
