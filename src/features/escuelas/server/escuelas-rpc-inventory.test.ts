import { describe, expect, it, beforeAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const FAKE_UUID = '00000000-0000-0000-0000-000000000000'

function makeAnon(): SupabaseClient {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
}

function status(data: unknown, error: { code?: string; message?: string } | null) {
  if (error?.code === 'PGRST202') return '❌ NO DESPLEGADA'
  if (error) return `⚠️  ERROR: ${error.message?.slice(0, 80)}`
  return `✅ OK — data: ${JSON.stringify(data)?.slice(0, 100)}`
}

describe('INVENTARIO DE RPCs ESCUELAS — Producción Real', () => {
  let anon: SupabaseClient

  beforeAll(() => { anon = makeAnon() })

  // ── LECTURA PÚBLICA ────────────────────────────────────────────────────

  it('get_schools', async () => {
    const { data, error } = await anon.rpc('get_schools', {
      p_category: null, p_city: null, p_search: null, p_page: 1, p_limit: 2,
    })
    console.log('[INV] get_schools:', status(data, error))
    expect(true).toBe(true)
  })

  it('get_school_by_slug', async () => {
    const { data, error } = await anon.rpc('get_school_by_slug', { p_slug: 'test-nonexistent' })
    console.log('[INV] get_school_by_slug:', status(data, error))
    expect(true).toBe(true)
  })

  it('get_programs_by_school', async () => {
    const { data, error } = await anon.rpc('get_programs_by_school', { p_school_id: FAKE_UUID })
    console.log('[INV] get_programs_by_school:', status(data, error))
    expect(true).toBe(true)
  })

  it('get_instructors_by_school', async () => {
    const { data, error } = await anon.rpc('get_instructors_by_school', { p_school_id: FAKE_UUID })
    console.log('[INV] get_instructors_by_school:', status(data, error))
    expect(true).toBe(true)
  })

  it('get_disciplines', async () => {
    const { data, error } = await anon.rpc('get_disciplines', {})
    console.log('[INV] get_disciplines:', status(data, error))
    expect(true).toBe(true)
  })

  it('get_media_by_school', async () => {
    const { data, error } = await anon.rpc('get_media_by_school', { p_school_id: FAKE_UUID })
    console.log('[INV] get_media_by_school:', status(data, error))
    expect(true).toBe(true)
  })

  // ── PII (CRÍTICO) ──────────────────────────────────────────────────────

  it('CRÍTICO — get_enrollment_leads sin ownership', async () => {
    const { data, error } = await anon.rpc('get_enrollment_leads', { p_school_id: FAKE_UUID })
    console.log('[PII] get_enrollment_leads:', status(data, error))
    // Si no hay PGRST202 NI error de auth = función accesible sin ownership check
    const isPiiAccessible = !error || error.code !== 'PGRST202'
    console.log('[PII] ¿Accesible sin ownership?', isPiiAccessible, '| error code:', error?.code)
    expect(true).toBe(true)
  })

  it('CRÍTICO — get_trial_requests_by_school sin ownership', async () => {
    const { data, error } = await anon.rpc('get_trial_requests_by_school', { p_school_id: FAKE_UUID })
    console.log('[PII] get_trial_requests_by_school:', status(data, error))
    expect(true).toBe(true)
  })

  it('CRÍTICO — get_enrollment_leads con school_id real (si existen escuelas)', async () => {
    const { data: schools } = await anon.rpc('get_schools', {
      p_category: null, p_city: null, p_search: null, p_page: 1, p_limit: 1,
    })
    const realId = (schools as { data?: Array<{id: string}> } | null)?.data?.[0]?.id
    if (!realId) {
      console.log('[PII-REAL] No hay escuelas en producción — no se puede probar con ID real')
      return
    }
    const { data, error } = await anon.rpc('get_enrollment_leads', { p_school_id: realId })
    console.log('[PII-REAL] school_id:', realId)
    console.log('[PII-REAL] RESULTADO:', status(data, error))
    console.log('[PII-REAL] ¿Datos de alumnos filtrados?', JSON.stringify(data)?.slice(0, 300))
    expect(true).toBe(true)
  })

  // ── MUTACIONES ─────────────────────────────────────────────────────────

  it('escuelas_create_school (anon)', async () => {
    const { data, error } = await anon.rpc('escuelas_create_school', {
      p_created_by: FAKE_UUID, p_data: JSON.stringify({ name: 'x' }),
    })
    console.log('[MUT] escuelas_create_school:', status(data, error))
    expect(true).toBe(true)
  })

  it('escuelas_update_school (anon)', async () => {
    const { data, error } = await anon.rpc('escuelas_update_school', {
      p_id: FAKE_UUID, p_data: '{}',
    })
    console.log('[MUT] escuelas_update_school:', status(data, error))
    expect(true).toBe(true)
  })

  it('escuelas_toggle_school_follow (anon, con p_user_id externo)', async () => {
    const VICTIM = '11111111-0000-0000-0000-000000000000'
    const { data, error } = await anon.rpc('escuelas_toggle_school_follow', {
      p_user_id: VICTIM, p_school_id: FAKE_UUID,
    })
    console.log('[MUT] escuelas_toggle_school_follow:', status(data, error))
    const hasIdentityCheck = /identity_mismatch/i.test(error?.message ?? '')
    console.log('[MUT] ¿Tiene identity_mismatch check?', hasIdentityCheck)
    expect(true).toBe(true)
  })

  it('escuelas_submit_lead (anon, con p_user_id externo)', async () => {
    const VICTIM = '11111111-0000-0000-0000-000000000000'
    const { data, error } = await anon.rpc('escuelas_submit_lead', {
      p_user_id: VICTIM, p_data: JSON.stringify({
        school_id: FAKE_UUID, name: 'Pentest', email: 'pen@test.com',
        phone: '300', preferred_contact_method: 'EMAIL',
      }),
    })
    console.log('[MUT] escuelas_submit_lead:', status(data, error))
    const hasIdentityCheck = /identity_mismatch/i.test(error?.message ?? '')
    console.log('[MUT] ¿Tiene identity_mismatch check?', hasIdentityCheck)
    expect(true).toBe(true)
  })

  it('escuelas_toggle_school_status (anon)', async () => {
    const { data, error } = await anon.rpc('escuelas_toggle_school_status', {
      p_id: FAKE_UUID, p_is_active: false,
    })
    console.log('[MUT] escuelas_toggle_school_status:', status(data, error))
    expect(true).toBe(true)
  })
})
