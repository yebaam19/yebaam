import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { Program, ProgramDetail, ProgramFilters } from '../types'

export const listPrograms = cache(async (filters: ProgramFilters = {}) => {
  const client = await getServerClient()
  const { page = 1, limit = 24, school_id, discipline_id, modality, level, search } = filters
  const { data: result, error } = await client.rpc('list_programs', {
    p_school_id:     school_id     ?? null,
    p_discipline_id: discipline_id ?? null,
    p_modality:      modality      ?? null,
    p_level:         level         ?? null,
    p_search:        search        ?? null,
    p_trial_class:   filters.trial_class_available ?? null,
    p_page:          page,
    p_limit:         limit,
  })
  if (error) throw new Error(error.message)
  const r = (result ?? { data: [], count: 0 }) as { data: Program[]; count: number }
  return { data: r.data ?? [], count: r.count ?? 0 }
})

export const getProgramById = cache(async (id: string): Promise<ProgramDetail | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_program_by_id', { p_id: id })
  if (error) throw new Error(error.message)
  return data as ProgramDetail | null
})

export const getProgramsBySchool = cache(async (schoolId: string): Promise<Program[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_programs_by_school', { p_school_id: schoolId })
  if (error) throw new Error(error.message)
  return (data ?? []) as Program[]
})
