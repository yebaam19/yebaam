/**
 * NEGOCIOS — Validación de producción
 *
 * Ejecuta todos los controles de seguridad y funcionalidad contra la BD real.
 * Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 *           SUPABASE_SERVICE_ROLE_KEY
 *
 * El Bloque 6 (HTTP) requiere el dev server en localhost:3000.
 * Si no está corriendo, ese bloque se omite con ⚠️.
 *
 * Uso:
 *   node scripts/production-validation.mjs
 *
 * Exit code 0 = PRODUCTION READY / 1 = BLOQUEADO
 */

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'fs'

// ── Configuración ─────────────────────────────────────────────────────────────

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const url      = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey  = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const svcKey   = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !svcKey) {
  console.error('FATAL: Falta NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const admin = createClient(url, svcKey, { auth: { persistSession: false } })

let passed = 0
let failed = 0
let warned = 0

function pass(label, detail = '') {
  passed++
  console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`)
}

function fail(label, detail = '') {
  failed++
  console.log(`  🔴 ${label}${detail ? ' — ' + detail : ''}`)
}

function warn(label, detail = '') {
  warned++
  console.log(`  ⚠️  ${label}${detail ? ' — ' + detail : ''}`)
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}`)
}

// ── Sesión autenticada ────────────────────────────────────────────────────────

async function makeSession(email) {
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink', email,
  })
  if (linkErr) throw new Error(`generateLink(${email}): ${linkErr.message}`)

  const cookieStore = {}
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => Object.entries(cookieStore).map(([name, value]) => ({ name, value })),
      setAll: (cs) => { for (const { name, value } of cs) cookieStore[name] = value },
    },
  })

  const { data: v, error: vErr } = await client.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  })
  if (vErr) throw new Error(`verifyOtp(${email}): ${vErr.message}`)
  return { client, userId: v.user.id, cookieStore }
}

// Cookie string para peticiones HTTP brutas
function cookieHeader(cookieStore) {
  return Object.entries(cookieStore)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ')
}

// ── Chequeo de servidor HTTP ──────────────────────────────────────────────────

async function devServerRunning() {
  try {
    const r = await fetch('http://localhost:3000/', { signal: AbortSignal.timeout(2000) })
    return r.status < 600
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const stamp   = Date.now()
  const emailA  = `pv-a-${stamp}@yebaam-test.local`
  const emailB  = `pv-b-${stamp}@yebaam-test.local`

  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║   NEGOCIOS — VALIDACIÓN DE PRODUCCIÓN                   ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  const { data: uA, error: eA } = await admin.auth.admin.createUser({ email: emailA, email_confirm: true })
  if (eA) throw new Error(eA.message)
  const { data: uB, error: eB } = await admin.auth.admin.createUser({ email: emailB, email_confirm: true })
  if (eB) throw new Error(eB.message)

  console.log(`\nUsuarios de test: A=${uA.user.id.slice(0,8)}… (admin) | B=${uB.user.id.slice(0,8)}… (ordinario)`)

  let businessId

  try {
    const sessA = await makeSession(emailA)
    const sessB = await makeSession(emailB)

    // ── 1. Crear negocio ─────────────────────────────────────────────────
    section('BLOQUE 1 — Creación de negocio')

    const bSlug = `pv-biz-${stamp}`
    const { data: biz, error: bizErr } = await sessA.client.rpc('comidas_create_business', {
      p_data: { name: 'PV Business', slug: bSlug, category: 'restaurante' },
    })
    if (bizErr) {
      fail('comidas_create_business debe funcionar', bizErr.message)
    } else {
      businessId = biz.id
      pass('comidas_create_business crea negocio correctamente', `id=${businessId.slice(0,8)}`)
    }

    if (!businessId) {
      console.log('\n🔴 Sin negocio de prueba, no es posible continuar los tests.\n')
      process.exit(1)
    }

    // ── 2. Firmas de RPCs — deben rechazar p_user_id ─────────────────────
    section('BLOQUE 2 — Seguridad: RPCs sin p_user_id')

    const rpcChecks = [
      {
        label: 'toggle_business_follow rechaza firma (business_id, user_id)',
        args:  { p_business_id: businessId, p_user_id: uB.user.id },
        rpc:   'toggle_business_follow',
        failMsg: 'identity spoofing activo en follow',
      },
      {
        label: 'toggle_business_like rechaza firma (business_id, user_id)',
        args:  { p_business_id: businessId, p_user_id: uB.user.id },
        rpc:   'toggle_business_like',
        failMsg: 'identity spoofing activo en like',
      },
      {
        label: 'toggle_business_customer rechaza firma (business_id, user_id)',
        args:  { p_business_id: businessId, p_user_id: uB.user.id },
        rpc:   'toggle_business_customer',
        failMsg: 'identity spoofing activo en customer',
      },
      {
        label: 'get_my_businesses rechaza firma con p_user_id',
        args:  { p_user_id: uB.user.id },
        rpc:   'get_my_businesses',
        failMsg: 'enumeración de negocios ajenos activa',
      },
      {
        label: 'get_business_engagement rechaza firma con p_user_id',
        args:  { p_business_id: businessId, p_user_id: uB.user.id },
        rpc:   'get_business_engagement',
        failMsg: 'spoofing de estado de engagement activo',
      },
      {
        label: 'get_businesses_followed_by_user rechaza p_user_id',
        args:  { p_user_id: uB.user.id },
        rpc:   'get_businesses_followed_by_user',
        failMsg: 'enumeración de follows ajenos activa',
      },
      {
        label: 'comidas_create_review rechaza firma con p_user_id',
        args:  { p_user_id: uB.user.id, p_data: { business_id: businessId, rating: 5, comment: 'spoofed' } },
        rpc:   'comidas_create_review',
        failMsg: 'spoofing de autor de reseña activo',
      },
    ]

    for (const chk of rpcChecks) {
      const { error } = await sessA.client.rpc(chk.rpc, chk.args)
      error
        ? pass(chk.label, error.message.slice(0, 80))
        : fail(chk.label, chk.failMsg)
    }

    // get_my_admin_record: B intenta leer como A
    const { error: eAdmin } = await sessB.client.rpc('get_my_admin_record', {
      p_business_id: businessId, p_user_id: uA.user.id,
    })
    eAdmin
      ? pass('get_my_admin_record rechaza p_user_id cruzado', eAdmin.message.slice(0, 80))
      : fail('get_my_admin_record acepta p_user_id', 'escalada de privilegios posible')

    // ── 3. Acceso a lista de administradores ─────────────────────────────
    section('BLOQUE 3 — Seguridad: get_business_admins')

    const { data: adminsB, error: adminsErrB } = await sessB.client.rpc('get_business_admins', { p_business_id: businessId })
    adminsErrB
      ? pass('No-admin no puede ver la lista de administradores', adminsErrB.message.slice(0,80))
      : fail('get_business_admins expone la lista a un usuario ordinario', JSON.stringify(adminsB).slice(0,100))

    const { data: adminsA, error: adminsErrA } = await sessA.client.rpc('get_business_admins', { p_business_id: businessId })
    adminsErrA
      ? fail('get_business_admins falla para el admin real', adminsErrA.message)
      : pass('Admin real puede ver la lista de administradores', `${(adminsA ?? []).length} registro(s)`)

    // ── 4. Visibilidad de negocio inactivo ───────────────────────────────
    section('BLOQUE 4 — Seguridad: negocio inactivo')

    const { error: deactivateErr } = await sessA.client.rpc('comidas_update_business_status', {
      p_id: businessId, p_is_active: false,
    })
    if (deactivateErr) warn('No se pudo desactivar (comidas_update_business_status)', deactivateErr.message)

    const { data: inactiveB } = await sessB.client.rpc('get_business_by_id', { p_id: businessId })
    !inactiveB
      ? pass('Negocio inactivo oculto a usuario ordinario')
      : fail('get_business_by_id expone negocio inactivo a usuario ordinario')

    const { data: inactiveA, error: inactiveAErr } = await sessA.client.rpc('get_business_by_id', { p_id: businessId })
    inactiveA && !inactiveAErr
      ? pass('Admin ve su propio negocio inactivo (dashboard ok)')
      : fail('Admin no puede ver su negocio inactivo (rompe dashboard)', inactiveAErr?.message)

    // Reactivar para tests siguientes
    await sessA.client.rpc('comidas_update_business_status', { p_id: businessId, p_is_active: true })

    // ── 5. Engagement ────────────────────────────────────────────────────
    section('BLOQUE 5 — Funcional: follow / like / customer')

    const { data: followRes, error: followErr } = await sessB.client.rpc('toggle_business_follow', { p_business_id: businessId })
    followErr
      ? fail('toggle_business_follow falla', followErr.message)
      : pass('toggle_business_follow funciona', `is_following=${followRes?.is_following}`)

    // Verificar persistencia en business_follows
    const { data: bfRow } = await admin
      .schema('comidas')
      .from('business_follows')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', uB.user.id)
      .maybeSingle()
    bfRow
      ? pass('Follow de B guardado en business_follows')
      : fail('Follow de B NO está en business_follows')

    // Verificar que el follow de A no fue contaminado
    const { data: afRow } = await admin
      .schema('comidas')
      .from('business_follows')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', uA.user.id)
      .maybeSingle()
    !afRow
      ? pass('Follow de A no fue contaminado por la acción de B')
      : fail('Follow de A fue afectado por la acción de B (cross-contamination)')

    const { data: likeRes, error: likeErr } = await sessB.client.rpc('toggle_business_like', { p_business_id: businessId })
    likeErr
      ? fail('toggle_business_like falla', likeErr.message)
      : pass('toggle_business_like funciona', `has_liked=${likeRes?.has_liked}`)

    const { data: custRes, error: custErr } = await sessB.client.rpc('toggle_business_customer', { p_business_id: businessId })
    custErr
      ? fail('toggle_business_customer falla', custErr.message)
      : pass('toggle_business_customer funciona', `is_customer=${custRes?.is_customer}`)

    // ── 6. HTTP — publicaciones del negocio ──────────────────────────────
    section('BLOQUE 6 — Funcional: POST /api/posts (requiere dev server)')

    if (!(await devServerRunning())) {
      warn('Dev server no disponible en localhost:3000 — Bloque 6 omitido')
      warn('Inicia "pnpm dev" en otra terminal y vuelve a correr el script para validar este bloque')
    } else {
      const chB = cookieHeader(sessB.cookieStore)
      const chA = cookieHeader(sessA.cookieStore)

      const rUnauth = await fetch('http://localhost:3000/api/posts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Cookie: chB },
        body:    JSON.stringify({ content: 'Soy un impostor', businessId }),
      }).catch((e) => ({ status: -1, _err: e.message }))

      rUnauth.status === 403
        ? pass('No-admin bloqueado con 403 al publicar en negocio ajeno')
        : rUnauth.status === -1
          ? warn('Error de red al conectar con localhost:3000', rUnauth._err)
          : fail('No-admin puede publicar en el negocio (sin 403)', `status=${rUnauth.status}`)

      const rAdmin = await fetch('http://localhost:3000/api/posts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Cookie: chA },
        body:    JSON.stringify({ content: 'Post legítimo del negocio', businessId }),
      }).catch((e) => ({ ok: false, _err: e.message, json: async () => ({}) }))

      const rAdminJson = await rAdmin.json().catch(() => ({}))
      rAdmin.ok
        ? pass('Admin real puede publicar en su negocio', `postId=${rAdminJson?.data?.id?.slice(0,8)}`)
        : fail('Admin real bloqueado al publicar', `status=${rAdmin.status}`)

      if (rAdminJson?.data?.id) {
        await admin.from('posts').delete().eq('id', rAdminJson.data.id)
      }
    }

    // ── 7. Reseñas ───────────────────────────────────────────────────────
    section('BLOQUE 7 — Funcional: reseñas')

    const { data: reviewRes, error: reviewErr } = await sessB.client.rpc('comidas_create_review', {
      p_data: { business_id: businessId, rating: 4, comment: 'Excelente negocio' },
    })
    reviewErr
      ? fail('comidas_create_review(jsonb) falla', reviewErr.message)
      : pass('comidas_create_review(jsonb) funciona (sin p_user_id)', `id=${reviewRes?.id?.slice(0,8)}`)

    // ── 8. BD — consolidación follow_relations ───────────────────────────
    section('BLOQUE 8 — Base de datos: follow_relations eliminada')

    const { data: frRows, error: frErr } = await admin
      .schema('information_schema')
      .from('tables')
      .select('table_name')
      .eq('table_schema', 'comidas')
      .eq('table_name', 'follow_relations')
      .maybeSingle()

    if (frErr) {
      warn('No se pudo verificar comidas.follow_relations', frErr.message)
    } else if (!frRows) {
      pass('comidas.follow_relations fue eliminada (migración 20260619100000 aplicada)')
    } else {
      warn('comidas.follow_relations todavía existe — migración 20260619100000 pendiente')
    }

    // ── 9. BD — tabla business_follows accesible ──────────────────────────
    section('BLOQUE 9 — Base de datos: business_follows existe')

    const { data: bfRows, error: bfErr } = await admin
      .schema('information_schema')
      .from('tables')
      .select('table_name')
      .eq('table_schema', 'comidas')
      .eq('table_name', 'business_follows')
      .maybeSingle()

    if (bfErr) {
      warn('No se pudo verificar comidas.business_follows', bfErr.message)
    } else if (bfRows) {
      pass('comidas.business_follows existe y es la tabla canónica de follows')
    } else {
      fail('comidas.business_follows NO existe — migración 20260619000000 pendiente')
    }

    // ── 10. Acceso público (anónimo) ─────────────────────────────────────
    section('BLOQUE 10 — Funcional: acceso sin autenticación')

    const anon = createClient(url, anonKey)
    const { data: bizPublic, error: bizPublicErr } = await anon.rpc('get_business_by_id', { p_id: businessId })
    bizPublic && !bizPublicErr
      ? pass('Visitante anónimo puede ver negocio activo')
      : fail('get_business_by_id no funciona para visitantes anónimos', bizPublicErr?.message)

    const { data: engAnon } = await anon.rpc('get_business_engagement', { p_business_id: businessId })
    engAnon
      ? pass('Visitante anónimo ve contadores de engagement')
      : warn('get_business_engagement no devuelve nada a visitantes anónimos')

    // ── RESUMEN ───────────────────────────────────────────────────────────

    console.log(`\n${'═'.repeat(60)}`)
    console.log(`  Pasados: ${passed} | Fallados: ${failed} | Advertencias: ${warned}`)
    console.log('═'.repeat(60))

    if (failed === 0) {
      console.log('\n  ✅ TODOS LOS CONTROLES PASARON — MÓDULO LISTO PARA PRODUCCIÓN\n')
    } else {
      console.log(`\n  🔴 ${failed} CONTROL(ES) FALLARON — MÓDULO BLOQUEADO PARA PRODUCCIÓN\n`)
    }

  } finally {
    // Limpieza
    if (businessId) {
      await admin.schema('comidas').from('reviews').delete().eq('business_id', businessId).catch(() => {})
      await admin.schema('comidas').from('business_follows').delete().eq('business_id', businessId).catch(() => {})
      await admin.schema('comidas').from('business_likes').delete().eq('business_id', businessId).catch(() => {})
      await admin.schema('comidas').from('business_customers').delete().eq('business_id', businessId).catch(() => {})
      await admin.schema('comidas').from('businesses').delete().eq('id', businessId).catch(() => {})
    }
    await admin.auth.admin.deleteUser(uA.user.id).catch(() => {})
    await admin.auth.admin.deleteUser(uB.user.id).catch(() => {})
    console.log('  [Cleanup] Usuarios y datos de test eliminados.')
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('\nFATAL:', e.message)
  process.exit(1)
})
