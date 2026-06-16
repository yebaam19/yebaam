import { cache } from 'react'
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
  if (error) throw new Error(error.message)
  const r = (result ?? { data: [], count: 0 }) as { data: School[]; count: number }
  return { data: r.data ?? [], count: r.count ?? 0 }
})

export const getSchoolBySlug = cache(async (slug: string): Promise<SchoolDetail | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_school_by_slug', { p_slug: slug })
  if (error) throw new Error(error.message)
  return data as SchoolDetail | null
})

export const getSchoolById = cache(async (id: string): Promise<School | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_school_by_id', { p_id: id })
  if (error) throw new Error(error.message)
  return data as School | null
})

export const getInstructorsBySchool = cache(async (schoolId: string): Promise<Instructor[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_instructors_by_school', { p_school_id: schoolId })
  if (error) throw new Error(error.message)
  return (data ?? []) as Instructor[]
})

export const getCampusesBySchool = cache(async (schoolId: string): Promise<Campus[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_campuses_by_school', { p_school_id: schoolId })
  if (error) throw new Error(error.message)
  return (data ?? []) as Campus[]
})

export const getDisciplines = cache(async (): Promise<Discipline[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_disciplines', {})
  if (error) throw new Error(error.message)
  return (data ?? []) as Discipline[]
})
