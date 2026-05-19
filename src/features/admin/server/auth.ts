import 'server-only'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server'

/**
 * Page-level guard for routes that require platform admin (not just forum
 * moderator) access. Use at the top of every `/admin/ciudades/**` page and
 * action. Redirects to `/admin` so the user sees the dashboard rather than a
 * raw 404 if they navigate manually.
 */
export async function requirePlatformAdmin(redirectTo: Route = '/admin' as Route): Promise<void> {
  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) redirect(redirectTo)
}
