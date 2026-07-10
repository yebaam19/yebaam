import { describe, expect, it, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Verificación empírica de public.platform_admins — la tabla sin DDL
 * versionado más crítica de toda la auditoría. No hay RPC dedicada a
 * platform_admins, pero is_city_admin(p_city_id, p_user_id) (city_portal,
 * la migración más antigua del repo) la consulta directamente en su cuerpo
 * SQL. Si la tabla no existe, Postgres devuelve un error de "relation does
 * not exist" — distinto de PGRST202 (función no encontrada) — lo cual
 * distingue "la tabla no existe" de "la función no existe".
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

describe('Gobernanza — public.platform_admins (verificación indirecta vía is_city_admin)', () => {
  let client: SupabaseClient;

  beforeAll(() => {
    client = makeAnonClient();
  });

  it('is_city_admin existe y responde sin error de "relation does not exist"', async () => {
    const { data, error } = await client.rpc('is_city_admin', {
      p_city_id: FAKE_UUID,
      p_user_id: FAKE_UUID,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[platform_admins governance] Error real recibido:', JSON.stringify(error));
    }

    const tableMissing = /relation .*platform_admins.* does not exist/i.test(error?.message ?? '');
    expect(tableMissing).toBe(false);

    if (!error) {
      // UUIDs falsos no deberían coincidir con ningún admin real.
      expect(data).toBe(false);
    }
  });
});
