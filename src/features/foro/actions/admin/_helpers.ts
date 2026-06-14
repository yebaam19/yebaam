import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import type { OwnerType, SpaceVisibility } from '@/features/foro/types'

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) || 'espacio'
  )
}

export function normalizeVisibility(raw: string | null | undefined): SpaceVisibility {
  const v = (raw ?? 'public').toLowerCase()
  if (v === 'private') return 'private'
  if (v === 'secret') return 'secret'
  return 'public'
}

export function deriveDisplayName(
  p: {
    username: string | null
    first_name: string | null
    last_name: string | null
    display_name: string | null
  },
  fallback: string,
): string {
  return (
    p.display_name ||
    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
    p.username ||
    fallback
  )
}

export async function ensureUniqueSpaceSlug(
  client: Awaited<ReturnType<typeof getServerClient>>,
  base: string,
): Promise<string> {
  let candidate = base
  let n = 1
  while (n < 100) {
    const { data } = await client
      .from('forum_spaces')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!data) return candidate
    n += 1
    candidate = `${base}-${n}`
  }
  return `${base}-${Date.now()}`
}

export async function resolveOwner(
  client: Awaited<ReturnType<typeof getServerClient>>,
  ownerType: OwnerType,
  ownerId: string,
): Promise<{ name: string; slug: string | null; privacy: SpaceVisibility; ownerUserId: string | null } | null> {
  switch (ownerType) {
    case 'club': {
      const { data } = await client
        .from('clubs')
        .select('name, slug, privacy, owner_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: (data as { slug: string | null }).slug ?? null,
        privacy: normalizeVisibility((data as { privacy: string | null }).privacy),
        ownerUserId: (data as { owner_id: string | null }).owner_id ?? null,
      }
    }
    case 'group': {
      const { data } = await client
        .from('groups')
        .select('name, privacy, creator_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: null,
        privacy: normalizeVisibility((data as { privacy: string | null }).privacy),
        ownerUserId: (data as { creator_id: string | null }).creator_id ?? null,
      }
    }
    case 'page': {
      const { data } = await client
        .from('pages')
        .select('name, slug, privacy, owner_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: (data as { slug: string | null }).slug ?? null,
        privacy: normalizeVisibility((data as { privacy: string | null }).privacy),
        ownerUserId: (data as { owner_id: string | null }).owner_id ?? null,
      }
    }
    case 'blog': {
      const { data } = await client
        .from('blogs')
        .select('name, slug, owner_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: (data as { slug: string | null }).slug ?? null,
        privacy: 'public',
        ownerUserId: (data as { owner_id: string | null }).owner_id ?? null,
      }
    }
    case 'profile': {
      const { data } = await client
        .from('profiles')
        .select('id, username, display_name, first_name, last_name')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      const p = data as {
        id: string
        username: string | null
        display_name: string | null
        first_name: string | null
        last_name: string | null
      }
      const name =
        p.display_name ||
        [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
        p.username ||
        'Perfil'
      return { name, slug: p.username ?? null, privacy: 'public', ownerUserId: p.id }
    }
    case 'portal': {
      return { name: 'Portal', slug: 'portal', privacy: 'public', ownerUserId: null }
    }
    case 'community': {
      const { data } = await client
        .from('communities')
        .select('name, slug, privacy, owner_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: (data as { slug: string | null }).slug ?? null,
        privacy: normalizeVisibility((data as { privacy: string | null }).privacy),
        ownerUserId: (data as { owner_id: string | null }).owner_id ?? null,
      }
    }
    default:
      return null
  }
}

export async function revalidateSpaceBySlug(
  client: Awaited<ReturnType<typeof getServerClient>>,
  spaceId: string,
): Promise<void> {
  const { data: space } = await client
    .from('forum_spaces')
    .select('slug')
    .eq('id', spaceId)
    .maybeSingle()
  if (space) revalidatePath(`/foro/${(space as { slug: string }).slug}`)
}
