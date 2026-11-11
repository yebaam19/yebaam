import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'

export const getCityBusinessDisclosures = cache(async (businessId: string) => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('city_business_disclosures', { p_id: businessId })
  if (error) throw new Error('No se pudo cargar la información legal del negocio.')
  return data as { legal_name: string; tax_id: string; address: string; phone: string; prices_include_tax: boolean } | null
})
