/**
 * SECURITY REGRESSION TESTS — Módulo Escuelas
 *
 * These tests validate that the security fixes from migration
 * 20260708000000_escuelas_security_hardening.sql are applied and working.
 *
 * BEFORE migration: tests FAIL (vulnerability confirmed present)
 * AFTER migration:  tests PASS (vulnerability confirmed fixed)
 *
 * Run after applying the migration to confirm all fixes landed.
 */

import { describe, expect, it, beforeAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const REAL_SCHOOL_ID = 'e1000002-0000-0000-0000-000000000000'

function makeAnon(): SupabaseClient {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe('Regresión de seguridad — post-migración 20260708000000', () => {
  let anon: SupabaseClient

  beforeAll(() => { anon = makeAnon() })

  it('SEC-REG-001: get_enrollment_leads rechaza anon con error de autorización', async () => {
    const { data, error } = await anon.rpc('get_enrollment_leads', { p_school_id: REAL_SCHOOL_ID })
    // Post-fix: debe rechazar con school_admin_required o auth_required
    const isRejected = error !== null && (
      /school_admin_required/i.test(error.message ?? '') ||
      /auth_required/i.test(error.message ?? '')
    )
    console.log('[SEC-REG-001] error:', JSON.stringify(error))
    console.log('[SEC-REG-001] ¿Fue rechazado correctamente?', isRejected)
    // NOTE: This test FAILS until migration 20260708000000 is applied to the database
    expect(isRejected).toBe(true)
  })

  it('SEC-REG-002: check_school_admin RPC existe y es callable', async () => {
    const { error } = await anon.rpc('check_school_admin', { p_school_id: REAL_SCHOOL_ID })
    const notFound = error?.code === 'PGRST202'
    console.log('[SEC-REG-002] error:', JSON.stringify(error))
    // The RPC must exist (may return false for anon, but must not be PGRST202)
    expect(notFound).toBe(false)
  })

  it('SEC-REG-003: escuelas_toggle_school_follow firma sin p_user_id (1 param)', async () => {
    const { error } = await anon.rpc('escuelas_toggle_school_follow', { p_school_id: REAL_SCHOOL_ID })
    // Post-fix: accepts 1 param (not 2). May reject by auth, but NOT by PGRST202 (wrong signature)
    const wrongSignature = error?.code === 'PGRST202'
    console.log('[SEC-REG-003] error:', JSON.stringify(error))
    expect(wrongSignature).toBe(false)
  })

  it('SEC-REG-004: escuelas_submit_lead firma sin p_user_id (1 param)', async () => {
    const { error } = await anon.rpc('escuelas_submit_lead', {
      p_data: JSON.stringify({
        school_id: REAL_SCHOOL_ID,
        name: 'Test',
        email: 'test@reg.test',
        phone: '3001234567',
        preferred_contact_method: 'EMAIL',
      }),
    })
    const wrongSignature = error?.code === 'PGRST202'
    console.log('[SEC-REG-004] error:', JSON.stringify(error))
    expect(wrongSignature).toBe(false)
  })
})
