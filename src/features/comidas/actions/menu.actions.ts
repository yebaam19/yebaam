'use server'

import { z } from 'zod'
import { getServerClient } from '@/utils/supabase/server'
import { isUserBusinessAdmin } from '../server/business.server'
import { revalidateBusinessAdmin } from '../lib/revalidate-admin'
import type { Menu, MenuCategory } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

async function requireBusinessAdmin(businessId: string) {
  if (!(await isUserBusinessAdmin(businessId))) {
    throw new Error('No tienes permisos para administrar este negocio')
  }
}

const CategoryNameSchema = z.string().min(2).max(80)

/**
 * Crea la primera categoría de menú de un negocio. Si el negocio todavía
 * no tiene ningún menú (caso de todo negocio recién creado), crea uno por
 * defecto ("Menú principal") antes — el usuario nunca necesita pensar en
 * la jerarquía menú→categoría para publicar su primer producto.
 */
export async function createMenuCategory(businessId: string, categoryName: string) {
  const { client } = await requireSession()
  await requireBusinessAdmin(businessId)

  const parsedName = CategoryNameSchema.parse(categoryName.trim())

  const { data: existingMenus, error: menusError } = await client.rpc('get_menus_by_business', {
    p_business_id: businessId,
  })
  if (menusError) throw new Error(menusError.message)

  let menuId = (existingMenus as Array<{ id: string }> | null)?.[0]?.id

  if (!menuId) {
    const { data: newMenu, error: createMenuError } = await client.rpc('comidas_create_menu', {
      p_data: { business_id: businessId, name: 'Menú principal' },
    })
    if (createMenuError) throw new Error(createMenuError.message)
    menuId = (newMenu as Menu).id
  }

  const { data, error } = await client.rpc('comidas_create_menu_category', {
    p_data: { menu_id: menuId, name: parsedName },
  })
  if (error) throw new Error(error.message)

  revalidateBusinessAdmin(businessId, 'productos')
  return data as MenuCategory
}
