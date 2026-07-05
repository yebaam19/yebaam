/**
 * E2E: private-chat at-rest encryption (AES-256-GCM) against a local dev
 * server + the live Supabase project. Mirrors the e2e-rc2.mjs harness: two
 * throwaway accounts, real GoTrue sessions, real Next.js API routes.
 *
 * Asserts the full contract:
 *  - POST message → API returns plaintext, DB row stores `enc:v1:` ciphertext
 *  - GET list + GET single (realtime decrypt-fetch path) return plaintext
 *  - PATCH edit re-encrypts; DELETE leaves a clean tombstone
 *  - conversation-list preview (lastMessage) is decrypted, isEncrypted=true
 *  - participant report lands in message_reports; self-report rejected
 *  - non-admin blocked from /api/admin/compliance/chat-decrypt
 *
 * Run with the dev server up:  node scripts/e2e-chat-encryption.mjs
 * Cleans up its accounts + conversation afterwards.
 */

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
const BASE = process.env.E2E_BASE ?? 'http://localhost:3000'

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

let failures = 0
function fail(label, err) {
  failures++
  console.log(`❌ ${label}:`, err)
  process.exitCode = 1
}
function ok(label, detail) {
  console.log(`✅ ${label}${detail ? ' -> ' + detail : ''}`)
}
function assert(cond, label, detail) {
  if (cond) ok(label, detail)
  else fail(label, detail ?? 'assertion failed')
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

async function api(session, method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: session.cookieHeader },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await response.json().catch(() => null)
  return { status: response.status, json }
}

async function main() {
  const stamp = Date.now()
  const emailA = `chat-e2e-a-${stamp}@yebaam-test.local`
  const emailB = `chat-e2e-b-${stamp}@yebaam-test.local`
  const PLAINTEXT = `Mensaje secreto de prueba ${stamp} 🚀`
  const EDITED = `Mensaje editado ${stamp}`

  console.log('=== Setup: two throwaway accounts ===')
  const { data: userA, error: errA } = await admin.auth.admin.createUser({ email: emailA, email_confirm: true })
  if (errA) return fail('createUser A', errA.message)
  const { data: userB, error: errB } = await admin.auth.admin.createUser({ email: emailB, email_confirm: true })
  if (errB) return fail('createUser B', errB.message)
  ok('accounts created')

  let convId = null
  try {
    const A = await makeSessionedClient(emailA)
    const B = await makeSessionedClient(emailB)
    ok('sessions established')

    console.log('\n=== Conversation + send ===')
    const conv = await api(A, 'POST', '/api/conversations', { participantId: B.userId })
    convId = conv.json?.data?.id
    assert(conv.status === 200 && convId, 'A creates direct conversation', convId)
    assert(conv.json?.data?.isEncrypted === true, 'conversation advertised as encrypted (isEncrypted=true)')

    const sent = await api(A, 'POST', `/api/conversations/${convId}/messages`, { content: PLAINTEXT })
    const msgId = sent.json?.data?.id
    assert(sent.status === 200 && msgId, 'A sends message', msgId)
    assert(sent.json?.data?.content === PLAINTEXT, 'POST response returns plaintext to sender')

    const { data: rawRow } = await admin.from('messages').select('content').eq('id', msgId).single()
    assert(rawRow?.content?.startsWith('enc:v1:'), 'DB row is AES-256-GCM ciphertext', rawRow?.content?.slice(0, 24) + '…')
    assert(!rawRow?.content?.includes('secreto'), 'plaintext absent from stored row')

    console.log('\n=== Reads decrypt ===')
    const listB = await api(B, 'GET', `/api/conversations/${convId}/messages?limit=10&offset=0`)
    const fromList = listB.json?.data?.find((m) => m.id === msgId)
    assert(fromList?.content === PLAINTEXT, 'B GET list returns plaintext')

    const single = await api(B, 'GET', `/api/conversations/${convId}/messages/${msgId}`)
    assert(single.json?.data?.content === PLAINTEXT, 'B GET single message (realtime fetch path) returns plaintext')

    const convList = await api(A, 'GET', '/api/conversations')
    const convRow = convList.json?.data?.find((c) => c.id === convId)
    assert(convRow?.lastMessage?.content === PLAINTEXT, 'conversation-list preview decrypted')
    assert(convRow?.isEncrypted === true, 'conversation list marks it encrypted')

    console.log('\n=== Edit re-encrypts ===')
    const edited = await api(A, 'PATCH', `/api/conversations/${convId}/messages/${msgId}`, { content: EDITED })
    assert(edited.status === 200 && edited.json?.data?.content === EDITED, 'PATCH returns edited plaintext')
    const { data: rawEdited } = await admin.from('messages').select('content, edited_at').eq('id', msgId).single()
    assert(rawEdited?.content?.startsWith('enc:v1:'), 'edited row re-encrypted')
    assert(Boolean(rawEdited?.edited_at), 'edited_at set')

    console.log('\n=== Report flow (participant compliance trigger) ===')
    const selfReport = await api(A, 'POST', `/api/conversations/${convId}/messages/${msgId}/report`, {})
    assert(selfReport.status === 400, 'self-report rejected (400)', String(selfReport.status))

    const report = await api(B, 'POST', `/api/conversations/${convId}/messages/${msgId}/report`, { reason: 'e2e prueba' })
    assert(report.status === 200 && report.json?.success, 'B reports A message')
    const { data: reportRow } = await admin.from('message_reports').select('id, status, reporter_id').eq('message_id', msgId).maybeSingle()
    assert(reportRow?.status === 'pending' && reportRow?.reporter_id === B.userId, 'message_reports row pending')

    const dupReport = await api(B, 'POST', `/api/conversations/${convId}/messages/${msgId}/report`, {})
    assert(dupReport.status === 200, 'duplicate report idempotent (200)')

    console.log('\n=== Admin decrypt endpoint locked ===')
    const denied = await api(B, 'POST', '/api/admin/compliance/chat-decrypt', {
      conversationId: convId,
      legalBasis: 'participant_report',
      reason: 'should not work — not an admin',
      reportId: reportRow?.id,
    })
    assert(denied.status === 403, 'non-admin blocked from compliance decrypt (403)', String(denied.status))

    console.log('\n=== Soft delete tombstone ===')
    const del = await api(A, 'DELETE', `/api/conversations/${convId}/messages/${msgId}`)
    assert(del.status === 200, 'DELETE ok')
    const { data: tomb } = await admin.from('messages').select('content, is_deleted').eq('id', msgId).single()
    assert(tomb?.is_deleted === true && tomb?.content === '', 'tombstone: is_deleted, content cleared')
  } catch (err) {
    fail('unexpected error', err.message ?? err)
  } finally {
    console.log('\n=== Cleanup ===')
    try {
      if (convId) {
        await admin.from('message_reports').delete().eq('conversation_id', convId)
        await admin.from('messages').delete().eq('conversation_id', convId)
        await admin.from('conversation_participants').delete().eq('conversation_id', convId)
        await admin.from('conversations').delete().eq('id', convId)
      }
      await admin.auth.admin.deleteUser(userA.user.id)
      await admin.auth.admin.deleteUser(userB.user.id)
      ok('cleanup done')
    } catch (err) {
      fail('cleanup', err.message ?? err)
    }
  }

  console.log(failures === 0 ? '\n🎉 ALL CHECKS PASSED' : `\n💥 ${failures} CHECK(S) FAILED`)
}

main()
