import { describe, expect, it, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Confirma que las firmas VIEJAS y vulnerables de funciones de identidad
 * (las que aceptaban p_user_id libre, corregidas en
 * 20260619000000_negocios_security_remediation.sql) fueron realmente
 * eliminadas — no solo que la versión nueva y segura coexiste con ellas.
 * PostgreSQL permite overloading por firma: que la versión segura exista
 * NO prueba que la insegura haya sido eliminada.
 */

const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

function makeAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in env');
  }
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
}

function isFunctionNotFound(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? '');
}

describe('Regresión de seguridad — firmas vulnerables deben estar eliminadas, no solo superseded', () => {
  let client: SupabaseClient;

  beforeAll(() => {
    client = makeAnonClient();
  });

  it('check_business_admin(p_business_id, p_user_id) — la firma de 2 parámetros con p_user_id libre NO debe existir', async () => {
    const { error } = await client.rpc('check_business_admin', {
      p_business_id: FAKE_UUID,
      p_user_id: FAKE_UUID,
    });
    expect(isFunctionNotFound(error)).toBe(true);
  });

  it('get_my_admin_record(p_business_id, p_user_id) — la firma de 2 parámetros NO debe existir', async () => {
    const { error } = await client.rpc('get_my_admin_record', {
      p_business_id: FAKE_UUID,
      p_user_id: FAKE_UUID,
    });
    expect(isFunctionNotFound(error)).toBe(true);
  });

  it('comidas_toggle_business_follow(p_user_id, p_business_id) — huérfana, NO debe existir', async () => {
    const { error } = await client.rpc('comidas_toggle_business_follow', {
      p_user_id: FAKE_UUID,
      p_business_id: FAKE_UUID,
    });
    expect(isFunctionNotFound(error)).toBe(true);
  });

  it('toggle_business_follow(p_business_id) — versión segura de 1 parámetro SÍ debe existir', async () => {
    const { error } = await client.rpc('toggle_business_follow', { p_business_id: FAKE_UUID });
    // Como anon sin sesión, debe rechazar por auth_required (función existe,
    // solo rechaza por falta de autenticación) — nunca PGRST202.
    expect(isFunctionNotFound(error)).toBe(false);
  });
});
