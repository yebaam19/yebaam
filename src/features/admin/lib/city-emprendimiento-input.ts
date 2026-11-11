import { EMPRENDIMIENTO_CATEGORIES } from '@/features/cities/data/emprendimientos'
import { isUuid } from '@/features/cities/directory/types'

export interface AdminEmprendimientoInput {
  id: string
  city_id: string
  name: string
  short_description: string
  story: string
  category: string
  zone: string
  address: string
  phone: string
  whatsapp: string
  hero_cf_image_id: string | null
  owner_cf_image_id: string | null
}

export const EMPRENDIMIENTO_FIELDS = {
  name: { label: 'Nombre del emprendimiento', max: 120 },
  short_description: { label: 'Descripción breve', max: 280 },
  story: { label: 'Historia', max: 5000 },
  zone: { label: 'Zona o barrio', max: 160 },
  address: { label: 'Dirección comercial', max: 200 },
  phone: { label: 'Teléfono', max: 30 },
  whatsapp: { label: 'WhatsApp', max: 30 },
} as const

export function validAdminEmprendimiento(input: AdminEmprendimientoInput): boolean {
  if (!input || !isUuid(input.id) || !isUuid(input.city_id)) return false
  if (!EMPRENDIMIENTO_CATEGORIES.some((category) => category === input.category)) return false
  for (const [key, { max }] of Object.entries(EMPRENDIMIENTO_FIELDS)) {
    const value = input[key as keyof typeof EMPRENDIMIENTO_FIELDS]
    if (typeof value !== 'string' || value.length > max) return false
  }
  if (!input.name.trim() || !input.short_description.trim()) return false
  return [input.hero_cf_image_id, input.owner_cf_image_id].every((id) =>
    id === null || (typeof id === 'string' && /^[A-Za-z0-9_-]{20,64}$/.test(id)))
}
