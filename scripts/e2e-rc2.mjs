import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const BASE = 'http://localhost:3000'

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

function fail(label, err) {
  console.log(`❌ ${label}:`, err)
  process.exitCode = 1
}
function ok(label, detail) {
  console.log(`✅ ${label}${detail ? ' -> ' + detail : ''}`)
}

async function makeSessionedClient(email) {
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (linkErr) throw new Error(`generateLink(${email}): ${linkErr.message}`)
  const hashed_token = linkData.properties.hashed_token

  const cookieStore = {}
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => Object.entries(cookieStore).map(([name, value]) => ({ name, value })),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) cookieStore[name] = value
      },
    },
  })

  const { data: verifyData, error: verifyErr } = await client.auth.verifyOtp({ type: 'magiclink', token_hash: hashed_token })
  if (verifyErr) throw new Error(`verifyOtp(${email}): ${verifyErr.message}`)

  await new Promise((r) => setTimeout(r, 400))

  const cookieHeader = Object.entries(cookieStore)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ')

  return { client, userId: verifyData.user.id, email, cookieHeader }
}

async function main() {
  const stamp = Date.now()
  const emailA = `e2e-a-${stamp}@yebaam-test.local`
  const emailB = `e2e-b-${stamp}@yebaam-test.local`

  console.log('=== Setup: creating two temp accounts (Usuario nuevo simulation) ===')
  const { data: userA, error: errA } = await admin.auth.admin.createUser({ email: emailA, email_confirm: true })
  if (errA) return fail('createUser A', errA.message)
  const { data: userB, error: errB } = await admin.auth.admin.createUser({ email: emailB, email_confirm: true })
  if (errB) return fail('createUser B', errB.message)
  ok('Account A created', userA.user.id)
  ok('Account B created', userB.user.id)

  let businessId, postId, sessionA, sessionB

  try {
    sessionA = await makeSessionedClient(emailA)
    sessionB = await makeSessionedClient(emailB)
    ok('Account A authenticated session (real cookie, real GoTrue JWT)')
    ok('Account B authenticated session (real cookie, real GoTrue JWT)')

    // ---- STEP 1: Account A — Registrar negocio / Crear negocio ----
    console.log('\n=== Cuenta A: Crear negocio (comidas_create_business RPC, same call as createBusiness Server Action) ===')
    const slug = `e2e-test-business-${stamp}`
    const { data: biz, error: bizErr } = await sessionA.client.rpc('comidas_create_business', {
      p_data: { name: 'E2E Test Business', slug, category: 'restaurante' },
    })
    if (bizErr) return fail('comidas_create_business', bizErr.message)
    businessId = biz.id
    ok('Negocio creado', `id=${businessId} slug=${biz.slug}`)

    // ---- STEP 2: confirm auto-admin trigger fired (business_admins row + check_business_admin RPC) ----
    const { data: isAdmin, error: isAdminErr } = await sessionA.client.rpc('check_business_admin', {
      p_business_id: businessId,
      p_user_id: userA.user.id,
    })
    if (isAdminErr) return fail('check_business_admin', isAdminErr.message)
    if (isAdmin !== true) return fail('auto-admin trigger', `expected true, got ${isAdmin}`)
    ok('Auto-admin trigger confirmó a Cuenta A como admin', `check_business_admin=${isAdmin}`)

    const { data: myBiz, error: myBizErr } = await sessionA.client.rpc('get_my_businesses', { p_user_id: userA.user.id })
    if (myBizErr) return fail('get_my_businesses (mis-negocios dashboard data)', myBizErr.message)
    if (!myBiz.some((b) => b.business.id === businessId)) return fail('get_my_businesses', 'negocio creado no aparece en Mis Negocios')
    ok('Negocio aparece en /feed/mis-negocios (get_my_businesses)', `count=${myBiz.length}`)

    // ---- STEP 3: Account A — Crear publicación (real HTTP through the actual POST /api/posts route I just fixed) ----
    console.log('\n=== Cuenta A: Crear publicación vía POST /api/posts (HTTP real contra dev server) ===')
    const postRes = await fetch(`${BASE}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionA.cookieHeader },
      body: JSON.stringify({ content: 'Publicación E2E de prueba', businessId }),
    })
    const postJson = await postRes.json()
    if (!postRes.ok || !postJson.success) return fail('POST /api/posts', `status=${postRes.status} body=${JSON.stringify(postJson)}`)
    postId = postJson.data.id
    ok('Publicación creada', `id=${postId} status=${postRes.status}`)

    const { data: postRow, error: postRowErr } = await admin.from('posts').select('id,business_id,author_id,privacy').eq('id', postId).maybeSingle()
    if (postRowErr || !postRow) return fail('verify post row', postRowErr?.message ?? 'not found')
    if (postRow.business_id !== businessId) return fail('post.business_id', `expected ${businessId}, got ${postRow.business_id}`)
    ok('post.business_id guardado correctamente en BD', postRow.business_id)

    // ---- STEP 4: Account B — Seguir negocio (toggle_business_follow — the RPC the live "Seguir" button actually calls via toggleFollow) ----
    console.log('\n=== Cuenta B: Seguir negocio (toggle_business_follow RPC) ===')
    const { data: followResult, error: followErr } = await sessionB.client.rpc('toggle_business_follow', {
      p_business_id: businessId,
      p_user_id: userB.user.id,
    })
    if (followErr) return fail('toggle_business_follow', followErr.message)
    if (!followResult?.is_following) return fail('toggle_business_follow', `expected is_following=true, got ${JSON.stringify(followResult)}`)
    ok('Cuenta B ahora sigue el negocio', JSON.stringify(followResult))

    // ---- STEP 5: Account B — Abrir Feed, ver publicación (real HTTP GET /api/posts?scope=timeline) ----
    console.log('\n=== Cuenta B: Abrir Feed vía GET /api/posts?scope=timeline (HTTP real) ===')
    const feedRes = await fetch(`${BASE}/api/posts?scope=timeline&limit=50`, {
      headers: { Cookie: sessionB.cookieHeader },
    })
    const feedJson = await feedRes.json()
    if (!feedRes.ok || !feedJson.success) return fail('GET timeline', `status=${feedRes.status} body=${JSON.stringify(feedJson)}`)
    const seen = feedJson.data.find((p) => p.id === postId)
    if (!seen) return fail('post visible en feed de Cuenta B', `no encontrado entre ${feedJson.data.length} posts`)
    ok('Publicación visible en el feed de Cuenta B', `businessId=${seen.businessId} businessName=${seen.businessName}`)
    if (!seen.businessId || !seen.businessName) fail('NEGOCIO badge data', 'businessId/businessName ausentes en el post mapeado')
    else ok('Datos para badge NEGOCIO presentes', `businessName=${seen.businessName} businessSlug=${seen.businessSlug ?? '(sin slug)'}`)

    // ---- STEP 6: Account B — Reaccionar ----
    console.log('\n=== Cuenta B: Reaccionar vía POST /api/posts/[id]/reactions ===')
    const reactRes = await fetch(`${BASE}/api/posts/${postId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionB.cookieHeader },
      body: JSON.stringify({ type: 'like' }),
    })
    const reactJson = await reactRes.json()
    if (!reactRes.ok || !reactJson.success) return fail('POST reaction', `status=${reactRes.status} body=${JSON.stringify(reactJson)}`)
    const { data: reactionRow } = await admin.from('reactions').select('id,type').eq('post_id', postId).eq('user_id', userB.user.id).maybeSingle()
    if (!reactionRow) return fail('reaction persistence', 'no row in reactions table')
    ok('Reacción persistida en BD', `type=${reactionRow.type}`)

    // ---- STEP 7: Account B — Comentar ----
    console.log('\n=== Cuenta B: Comentar vía POST /api/posts/[id]/comments ===')
    const commentRes = await fetch(`${BASE}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionB.cookieHeader },
      body: JSON.stringify({ content: 'Comentario E2E de prueba' }),
    })
    const commentJson = await commentRes.json()
    if (!commentRes.ok || !commentJson.success) return fail('POST comment', `status=${commentRes.status} body=${JSON.stringify(commentJson)}`)
    const { data: commentRow } = await admin.from('comments').select('id,content').eq('id', commentJson.data.id).maybeSingle()
    if (!commentRow) return fail('comment persistence', 'no row in comments table')
    ok('Comentario persistido en BD', `content="${commentRow.content}"`)

    const { data: postAfter } = await admin.from('posts').select('comments_count').eq('id', postId).maybeSingle()
    ok('posts.comments_count actualizado', `comments_count=${postAfter.comments_count}`)

    console.log('\n🎉 FLUJO COMPLETO E2E EXITOSO (Fase 2 — backend/API real, sin browser)')
  } catch (e) {
    fail('unexpected exception', e.message)
  } finally {
    console.log('\n=== Cleanup ===')
    if (postId) {
      await admin.from('comments').delete().eq('post_id', postId)
      await admin.from('reactions').delete().eq('post_id', postId)
      await admin.from('posts').delete().eq('id', postId)
    }
    if (businessId) {
      const { error: deactivateErr } = await admin.rpc('comidas_update_business_status', {
        p_id: businessId,
        p_is_active: false,
      })
      console.log(
        deactivateErr
          ? `⚠️  Could not deactivate test business: ${deactivateErr.message}`
          : `Test business marked inactive (no delete RPC exists yet): business_id=${businessId}, slug=e2e-test-business-${stamp}`,
      )
    }
    await admin.auth.admin.deleteUser(userA.user.id).catch(() => {})
    await admin.auth.admin.deleteUser(userB.user.id).catch(() => {})
    console.log('Temp auth users deleted.')
  }
}

main()
