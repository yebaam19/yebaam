/**
 * Admin-only Server Actions for `/admin/badges/**`. Every export gates via
 * `requireAdminWithUser()` (which redirects a non-admin before any mutation)
 * and returns the acting user id. RLS on badges/user_badges/badge_requests/
 * badge_audit_log already grants writes to `platform_admins`, so the queries
 * use the caller's session.
 *
 * This file is a plain barrel over the per-domain `'use server'` modules under
 * `./badges/`. Splitting keeps each action module small and single-purpose
 * while preserving this import path as the public surface for consumers.
 */

export * from './badges/catalog.actions'
export * from './badges/grants.actions'
export * from './badges/requests.actions'

export type { ActionResult } from './_shared'
