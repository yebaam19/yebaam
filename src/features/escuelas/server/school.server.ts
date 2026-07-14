import { cache } from 'react'
import * as Sentry from '@sentry/nextjs'
import { getServerClient } from '@/utils/supabase/server'
import type { School, SchoolDetail, Instructor, Campus, Discipline, SchoolFilters } from '../types'

export const listSchools = cache(async (filters: SchoolFilters = {}) => {
  const client = await getServerClient()
  const { page = 1, limit = 24, category, city, search } = filters
  const { data: result, error } = await client.rpc('get_schools', {
    p_category: category ?? null,
    p_city:     city     ?? null,
    p_search:   search   ?? null,
    p_page:     page,
    p_limit:    limit,
  })
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_schools' } })
    throw new Error(error.message)
  }
  const r = (result ?? { data: [], count: 0 }) as { data: School[]; count: number }
  return { data: r.data ?? [], count: r.count ?? 0 }
})

export const getSchoolBySlug = cache(async (slug: string): Promise<SchoolDetail | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_school_by_slug', { p_slug: slug })
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_school_by_slug', slug } })
    throw new Error(error.message)
  }
  // Migration 20260708000000 changed this RPC to return jsonb (single object), not SETOF.
  // Handle both formats for backward compatibility during the migration window.
  const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
  return row as SchoolDetail | null
})

export const getSchoolById = cache(async (id: string): Promise<School | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_school_by_id', { p_id: id })
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_school_by_id', id } })
    throw new Error(error.message)
  }
  return data as School | null
})

export const getInstructorsBySchool = cache(async (schoolId: string): Promise<Instructor[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_instructors_by_school', { p_school_id: schoolId })
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_instructors_by_school', schoolId } })
    return []
  }
  return (data ?? []) as Instructor[]
})

export const getCampusesBySchool = cache(async (schoolId: string): Promise<Campus[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_campuses_by_school', { p_school_id: schoolId })
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_campuses_by_school', schoolId } })
    return []
  }
  return (data ?? []) as Campus[]
})

export const getDisciplines = cache(async (): Promise<Discipline[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_disciplines', {})
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_disciplines' } })
    return []
  }
  return (data ?? []) as Discipline[]
})

/** Devuelve las escuelas que el usuario actual administra. */
export const getMySchools = cache(async (): Promise<School[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_my_schools')
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_my_schools' } })
    return []
  }
  return (data ?? []) as School[]
})

/** Verifica si el usuario actual es admin de la escuela dada. */
export async function checkSchoolAdmin(schoolId: string): Promise<boolean> {
  const client = await getServerClient()
  const { data, error } = await client.rpc('check_school_admin', { p_school_id: schoolId })
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'check_school_admin', schoolId } })
    return false
  }
  return Boolean(data)
}

/**
 * Lanza una excepción si el usuario actual no tiene acceso de admin a la escuela.
 * Defensa en profundidad para Server Actions — no depende solo del RPC DB-side.
 *
 * Primary:  school_admins table vía check_school_admin (cubre co-admins).
 * Fallback: campo created_by — protege a creadores cuya fila en school_admins
 *           esté ausente por migración parcial (escuelas creadas antes de la
 *           migración 20260708000000 que auto-inserta el row).
 */
export async function assertSchoolAdmin(schoolId: string): Promise<void> {
  const client = await getServerClient()
  const [{ data: { user } }, { data: isAdmin, error: adminError }] = await Promise.all([
    client.auth.getUser(),
    client.rpc('check_school_admin', { p_school_id: schoolId }),
  ])
  if (!user) throw new Error('No autenticado')
  if (adminError) {
    Sentry.captureException(adminError, { tags: { rpc: 'check_school_admin', schoolId } })
  }
  if (isAdmin) return
  // Fallback: el creador conserva acceso incluso si falta la fila en school_admins
  const school = await getSchoolById(schoolId)
  if (school && user.id === school.created_by) return
  throw new Error('No tienes permisos para administrar esta escuela')
}
