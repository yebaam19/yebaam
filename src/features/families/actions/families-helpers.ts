import 'server-only';

import { getServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const MAX_FAMILIES_PER_OWNER = 5;

export const MAX_INVITES_PER_HOUR = 20;

// Slugs that would shadow concrete /familias/<route> pages.
// Keep in sync with directories under src/app/(app)/(social)/familias/.
export const RESERVED_FAMILY_SLUGS = new Set(['nueva', 'invitaciones']);

export type Session = { userId: string; client: Awaited<ReturnType<typeof getServerClient>> };

export async function requireSession(): Promise<Session | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id, client };
}

export function familySlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      // Strip combining diacritical marks (U+0300–U+036F)
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'familia'
  );
}

// Revalidate the Familias listing and any [slug] page, without an extra DB
// hop to look up the slug. The 'page' selector tells Next to invalidate every
// rendered instance of the dynamic [slug] route.
export function revalidateFamilyPaths() {
  revalidatePath('/familias');
  revalidatePath('/familias/[slug]', 'page');
}
