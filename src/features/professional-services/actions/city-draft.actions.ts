'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { getMyServiceEligibility } from '../server/eligibility.server'

/** Consent is recorded by the provider's own session; the DB trigger repeats
 * authorization and verification checks and assigns the authoritative timestamp. */
export async function acceptCityServiceDraft(id: string, accepted: boolean) {
  if (!accepted || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: 'Debes aceptar la declaración y la publicación.' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Inicia sesión con la cuenta del prestador.' }
  const eligibility = await getMyServiceEligibility()
  if (!eligibility.eligible) return { ok: false, error: 'Necesitas un título o estudio verificado en tu perfil profesional antes de publicar.' }
  const { data, error } = await client.rpc('accept_city_service_draft', { p_id: id, p_accepted: accepted })
  if (error) return { ok: false, error: 'No se pudo registrar tu aceptación. Vuelve a intentar.' }
  if (!data) return { ok: false, error: 'El borrador no está pendiente o no te pertenece.' }
  revalidatePath('/professional-services/[slug]', 'page')
  revalidatePath('/professional-services')
  revalidatePath('/cities/[slug]/directory/services', 'page')
  revalidatePath('/admin/ciudades/[slug]', 'page')
  return { ok: true }
}
