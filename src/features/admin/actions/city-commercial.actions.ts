'use server'

import { revalidatePath } from 'next/cache'
import { SERVICE_CATEGORIES } from '@/features/professional-services/data/service-categories-taxonomy'
import { cityBusinessInput, cityServiceInput, type CityBusinessInput, type CityServiceInput } from '../lib/city-commercial'
import { requireAdminWithUser, revalidateCityById, slugify, type ActionResult } from './_shared'

export async function saveCityBusiness(input: CityBusinessInput): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' }
  const parsed = cityBusinessInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const v = parsed.data
  const { data, error } = await client.rpc('admin_save_city_business', {
    p_id: v.id, p_city_id: v.cityId,
    p_data: { name: v.name, slug: v.slug, category: v.category, description: v.description,
      address: v.address, phone: v.phone, legal_name: v.legalName, tax_id: v.taxId,
      prices_include_tax: v.pricesIncludeTax, is_active: v.active },
  })
  if (error || !data) return { ok: false, error: error?.code === '23505' ? 'Esa dirección de negocio ya existe.' : 'No se pudo guardar el negocio.' }
  await revalidateCityById(client, v.cityId, ['directory', 'directory/businesses'])
  revalidatePath('/negocios/[slug]', 'page')
  revalidatePath('/negocios')
  return { ok: true, data: { id: data as string } }
}

export async function saveCityService(input: CityServiceInput): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' }
  const parsed = cityServiceInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Revisa los campos del servicio.' }
  const v = parsed.data
  if (!SERVICE_CATEGORIES.some((c) => c.id === v.category)) return { ok: false, error: 'Categoría inválida.' }
  const { data: previous, error: readError } = await client.from('professional_services')
    .select('id,city_id,admin_created_by,provider_declaration_accepted_at,visibility').eq('id', v.id).maybeSingle()
  if (readError) return { ok: false, error: 'No se pudo comprobar el servicio.' }
  if (previous && previous.city_id !== v.cityId) return { ok: false, error: 'El servicio pertenece a otra ciudad.' }
  const patch = { name: v.name, description: v.description, address: v.address, phone: v.phone, category_id: v.category }
  if (previous) {
    // A city admin can hide a profile, but cannot opt its owner into public exposure.
    if (v.visibility !== 'PRIVATE' && v.visibility !== previous.visibility) {
      return { ok: false, error: 'El propietario debe autorizar la publicación desde su perfil.' }
    }
    const { data, error } = await client.from('professional_services').update({ ...patch, visibility: v.visibility })
      .eq('id', v.id).eq('city_id', v.cityId).select('id').maybeSingle()
    if (error || !data) return { ok: false, error: 'No se pudo guardar el servicio.' }
  } else {
    if (!v.username || v.visibility !== 'PRIVATE') return { ok: false, error: 'Indica el usuario del prestador. El servicio se crea privado.' }
    const { data: owner, error: ownerError } = await client.from('profiles').select('id')
      .eq('username', v.username.replace(/^@/, '')).maybeSingle()
    if (ownerError || !owner) return { ok: false, error: 'No se encontró ese nombre de usuario.' }
    const { error } = await client.from('professional_services').insert({
      ...patch, id: v.id, city_id: v.cityId, user_id: owner.id, admin_created_by: userId,
      slug: `${slugify(v.name)}-${v.id.slice(0, 8)}`, visibility: 'PRIVATE', status: 'PENDING_APPROVAL',
    })
    if (error) return { ok: false, error: 'No se pudo crear el borrador del servicio.' }
  }
  await revalidateCityById(client, v.cityId, ['directory', 'directory/services'])
  revalidatePath('/professional-services/[slug]', 'page')
  return { ok: true, data: { id: v.id } }
}
