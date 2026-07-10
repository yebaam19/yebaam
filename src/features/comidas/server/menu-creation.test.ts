import { describe, expect, it, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

/**
 * Documenta el estado real (no asumido) de las RPCs nuevas que arreglan
 * "no sirve crear producto": hasta que 20260627000000_menu_category_creation.sql
 * se aplique, este test falla a propósito — es la prueba de que el bug es
 * real y la señal de que falta desplegar la migración.
 */
describe('comidas_create_menu / comidas_create_menu_category — pendiente de despliegue', () => {
  let client: SupabaseClient;

  beforeAll(() => {
    client = makeAnonClient();
  });

  it('comidas_create_menu existe en producción', async () => {
    const { error } = await client.rpc('comidas_create_menu', {
      p_data: { business_id: FAKE_UUID, name: 'test' },
    });
    expect(isFunctionNotFound(error)).toBe(false);
  });

  it('comidas_create_menu_category existe en producción', async () => {
    const { error } = await client.rpc('comidas_create_menu_category', {
      p_data: { menu_id: FAKE_UUID, name: 'test' },
    });
    expect(isFunctionNotFound(error)).toBe(false);
  });
});
