import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { MenuWithCategories } from '../types'

export const getMenusByBusiness = cache(async (businessId: string): Promise<MenuWithCategories[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_menus_by_business', { p_business_id: businessId })
  if (error) throw new Error(error.message)
  return (data ?? []) as MenuWithCategories[]
})
