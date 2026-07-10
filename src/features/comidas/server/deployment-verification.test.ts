import { describe, expect, it, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Deployment certification — Fase 3 de la auditoría de producción.
 *
 * No mockea Supabase: golpea el proyecto real configurado en .env.local,
 * igual que el resto de la suite (ver city.server.test.ts). El objetivo no
 * es probar lógica de negocio — es distinguir empíricamente "el RPC existe
 * en la base de datos real" (PGRST202 ausente) de "el RPC no existe"
 * (PGRST202 presente), sin asumir nada sobre qué migraciones se aplicaron.
 *
 * Cada caso usa el cliente anon y argumentos diseñados para que la función,
 * SI EXISTE, rechace por autorización/validación antes de mutar cualquier
 * dato real — nunca se espera una mutación exitosa desde estos tests.
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

/** PGRST202 = PostgREST no encontró ninguna función con ese nombre/firma. */
function isFunctionNotFound(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? '');
}

describe('Certificación de despliegue — RPCs de esta sesión de auditoría', () => {
  let client: SupabaseClient;

  beforeAll(() => {
    client = makeAnonClient();
  });

  it('get_business_analytics (20260621000000) existe en la base real', async () => {
    const { error } = await client.rpc('get_business_analytics', { p_business_id: FAKE_UUID });
    // Read-only, UUID inexistente → debe responder con datos vacíos, no PGRST202.
    expect(isFunctionNotFound(error)).toBe(false);
  });

  it('comidas_add_business_admin (20260620000000) existe en la base real', async () => {
    const { error } = await client.rpc('comidas_add_business_admin', {
      p_business_id: FAKE_UUID,
      p_email: 'deployment-check@example.invalid',
    });
    // Como anon, auth.uid() es NULL → la función SI EXISTE rechaza por
    // "Only the primary admin can add co-admins", nunca llega a mutar nada.
    expect(isFunctionNotFound(error)).toBe(false);
  });

  it('comidas_remove_business_admin (20260620000000) existe en la base real', async () => {
    const { error } = await client.rpc('comidas_remove_business_admin', {
      p_business_id: FAKE_UUID,
      p_admin_user_id: FAKE_UUID,
    });
    expect(isFunctionNotFound(error)).toBe(false);
  });

  it('check_business_admin de un solo parámetro (20260619000000) existe en la base real', async () => {
    const { error } = await client.rpc('check_business_admin', { p_business_id: FAKE_UUID });
    // Read-only, debe responder false, no PGRST202.
    expect(isFunctionNotFound(error)).toBe(false);
  });

  it('las RPCs huérfanas (20260622000000) ya NO existen — confirma que el DROP se aplicó', async () => {
    const { error } = await client.rpc('get_products_by_business', { p_business_id: FAKE_UUID });
    // Aquí el resultado esperado es lo OPUESTO: SI sigue existiendo, el
    // DROP de la consolidación de RPCs nunca se aplicó.
    expect(isFunctionNotFound(error)).toBe(true);
  });

  // Regresión: estas 2 vienen de 20260608150000_bridge_functions.sql (la
  // migración más antigua de RPCs) y aun así faltaban en producción —
  // confirmado por diagnóstico cruzado: 4 de 6 funciones del mismo archivo
  // funcionaban, lo que descarta "la migración nunca se aplicó" y apunta a
  // que se ejecutó por partes en el SQL Editor. Fix puntual en
  // 20260628000000_fix_missing_menu_media_rpcs.sql.
  it('get_menus_by_business existe en la base real', async () => {
    const { error } = await client.rpc('get_menus_by_business', { p_business_id: FAKE_UUID });
    expect(isFunctionNotFound(error)).toBe(false);
  });

  it('get_media_by_business existe en la base real', async () => {
    const { error } = await client.rpc('get_media_by_business', { p_business_id: FAKE_UUID });
    expect(isFunctionNotFound(error)).toBe(false);
  });

  // Regresión: product.actions.ts/media.actions.ts/promotion.actions.ts hacían
  // sc.schema('comidas').from(...) para resolver ownership antes de editar —
  // eso falla con PGRST106 ("Invalid schema: comidas") porque comidas
  // correctamente no está expuesto vía PostgREST. Fix en
  // 20260629000000_fix_schema_exposure_ownership_lookups.sql: 3 RPCs que
  // hacen el lookup dentro de una función SQL en vez de una consulta REST
  // directa al schema.
  it('get_product_business_id existe en la base real', async () => {
    const { error } = await client.rpc('get_product_business_id', { p_product_id: FAKE_UUID });
    expect(isFunctionNotFound(error)).toBe(false);
  });

  it('get_media_business_id existe en la base real', async () => {
    const { error } = await client.rpc('get_media_business_id', { p_media_id: FAKE_UUID });
    expect(isFunctionNotFound(error)).toBe(false);
  });

  it('get_promotion_business_id existe en la base real', async () => {
    const { error } = await client.rpc('get_promotion_business_id', { p_promotion_id: FAKE_UUID });
    expect(isFunctionNotFound(error)).toBe(false);
  });
});
