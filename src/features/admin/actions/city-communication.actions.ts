'use server'

import { requireAdmin, revalidateCityById } from './_shared'
import { isUuid } from '@/features/cities/directory/types'

export async function provisionCityCommunication(cityId: string) {
  const { client } = await requireAdmin()
  if (!isUuid(cityId)) return { ok: false, error: 'Ciudad inválida.' }
  const { error } = await client.rpc('ensure_city_communication', { p_city_id: cityId })
  if (error) return { ok: false, error: 'No se pudo preparar el foro y el chat. Intenta nuevamente.' }
  await revalidateCityById(client, cityId, ['forums', 'public-chat'])
  return { ok: true }
}

export async function saveCityChat(input: {
  cityId: string; topicId: string; name: string; description: string; capacity: number; archived: boolean
}) {
  const { client } = await requireAdmin()
  if (!input || !isUuid(input.cityId) || !isUuid(input.topicId)
    || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100
    || typeof input.description !== 'string' || input.description.length > 2000
    || !Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 500
    || typeof input.archived !== 'boolean') return { ok: false, error: 'Revisa el nombre y la capacidad (1–500).' }
  const { data, error } = await client.from('public_chat_topics').update({
    name: input.name.trim(), description: input.description.trim(),
    max_capacity: input.capacity, is_archived: input.archived,
  }).eq('id', input.topicId).eq('city_id', input.cityId).eq('owner_type', 'city')
    .is('parent_topic_id', null).select('id').maybeSingle()
  if (error || !data) return { ok: false, error: 'No se pudo guardar la sala de esta ciudad.' }
  await revalidateCityById(client, input.cityId, ['public-chat'])
  return { ok: true }
}
