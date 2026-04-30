import type { OwnerType } from '@/features/foro/types'

// Brand metadata per owner type: consistent label, accent hue, and a short fallback
// icon glyph. Hues reference the existing `--color-feature-*` tokens defined in
// tailwind.css so all foro surfaces share one palette with the rest of the app.
type OwnerMeta = {
  label: string
  accent: string // CSS variable reference for bg/text
  dot: string
  badgeColor:
    | 'green'
    | 'emerald'
    | 'orange'
    | 'amber'
    | 'rose'
    | 'sky'
    | 'indigo'
    | 'purple'
    | 'teal'
    | 'zinc'
  glyph: string
}

const OWNER: Record<OwnerType, OwnerMeta> = {
  club: { label: 'Club', accent: 'var(--color-feature-clubs)', dot: 'bg-[var(--color-feature-clubs)]', badgeColor: 'emerald', glyph: 'C' },
  group: { label: 'Grupo', accent: 'var(--color-feature-communities)', dot: 'bg-[var(--color-feature-communities)]', badgeColor: 'orange', glyph: 'G' },
  blog: { label: 'Blog', accent: 'var(--color-feature-blogs)', dot: 'bg-[var(--color-feature-blogs)]', badgeColor: 'amber', glyph: 'B' },
  page: { label: 'Página', accent: 'var(--color-feature-businesses)', dot: 'bg-[var(--color-feature-businesses)]', badgeColor: 'indigo', glyph: 'P' },
  city: { label: 'Ciudad', accent: 'var(--color-feature-associations)', dot: 'bg-[var(--color-feature-associations)]', badgeColor: 'teal', glyph: 'C' },
  profile: { label: 'Perfil', accent: 'var(--color-feature-family)', dot: 'bg-[var(--color-feature-family)]', badgeColor: 'rose', glyph: 'U' },
  portal: { label: 'Comunidad', accent: 'var(--color-primary-600)', dot: 'bg-primary-600', badgeColor: 'green', glyph: 'Y' },
  community: { label: 'Comunidad', accent: 'var(--color-feature-communities)', dot: 'bg-[var(--color-feature-communities)]', badgeColor: 'orange', glyph: 'C' },
}

export function getOwnerMeta(type: OwnerType): OwnerMeta {
  return OWNER[type] ?? OWNER.portal
}

export function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
