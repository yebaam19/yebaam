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
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {
  // Real admin user with real businesses, found earlier this session.
  const email = 'mentedigital1225@gmail.com'
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (linkErr) throw new Error(linkErr.message)

  const cookieStore = {}
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => Object.entries(cookieStore).map(([name, value]) => ({ name, value })),
      setAll: (cs) => { for (const { name, value } of cs) cookieStore[name] = value },
    },
  })
  const { data: verifyData, error: verifyErr } = await client.auth.verifyOtp({ type: 'magiclink', token_hash: linkData.properties.hashed_token })
  if (verifyErr) throw new Error(verifyErr.message)
  await new Promise((r) => setTimeout(r, 400))
  const cookieHeader = Object.entries(cookieStore).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')

  const { data: myBiz, error: myBizErr } = await client.rpc('get_my_businesses')
  if (myBizErr) throw new Error(myBizErr.message)
  const businessId = myBiz[0].business.id
  console.log(`Real admin user ${email} (${verifyData.user.id}) administers business ${businessId} (${myBiz[0].business.name})`)

  const paths = [
    `/negocios/admin/${businessId}`,
    `/negocios/admin/${businessId}/administradores`,
    `/negocios/admin/${businessId}/publicaciones`,
  ]
  for (const p of paths) {
    const res = await fetch(`http://localhost:3000${p}`, { headers: { Cookie: cookieHeader }, redirect: 'manual' })
    console.log(`GET ${p} -> status=${res.status}`)
    if (res.status >= 500) {
      const text = await res.text()
      const match = text.match(/Could not find the function[^<"]*|PGRST\d+[^<"]*/)
      console.log(`  Body excerpt: ${match ? match[0] : text.slice(0, 300).replace(/\n/g, ' ')}`)
    }
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message)
  process.exit(1)
})
