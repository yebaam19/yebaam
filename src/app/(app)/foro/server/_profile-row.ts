import type { ForoAuthor } from '@/features/foro/types'

export type ProfileRow = {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
}

export function toAuthor(p: ProfileRow | undefined | null): ForoAuthor {
  if (!p) return { id: '', username: 'usuario', displayName: 'Usuario', avatarUrl: null }
  const displayName =
    p.display_name ||
    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
    p.username ||
    'Usuario'
  return {
    id: p.id,
    username: p.username ?? 'usuario',
    displayName,
    avatarUrl: p.avatar_url,
  }
}
