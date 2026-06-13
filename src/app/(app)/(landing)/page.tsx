import { redirect } from 'next/navigation'
import { getAuthUser } from '@/features/auth/actions/auth.actions'

// In normal flow this never renders: the proxy (src/proxy.ts) intercepts `/`
// and redirects to /feed or /login before the (app) shell layout is built —
// rendering that shell just to discard it was the top Active-CPU cost on `/`.
// Kept as a safety-net fallback for any path that bypasses the proxy.
export default async function Home() {
  const user = await getAuthUser()
  redirect((user ? '/feed' : '/login') as never)
}
