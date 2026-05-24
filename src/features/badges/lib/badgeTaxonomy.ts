/** Single source of truth for badge categories and tier labels (admin + catalog + profile). */

export const BADGE_CATEGORY_OPTIONS = [
  { value: 'verification', label: 'Verificación' },
  { value: 'engineering', label: 'Ingeniería de software' },
  { value: 'study', label: 'Estudio' },
  { value: 'recognition', label: 'Reconocimientos' },
  { value: 'pioneer', label: 'Pionero' },
  { value: 'authentication', label: 'Autenticación' },
  { value: 'other', label: 'Otra' },
] as const

export const BADGE_CATEGORY_LABEL: Record<string, string> = {
  verification: 'Verificación',
  engineering: 'Ingeniería de software',
  study: 'Estudio',
  sports: 'Deportes',
  recognition: 'Reconocimientos',
  pioneer: 'Pionero',
  authentication: 'Autenticación',
  other: 'Otra',
}

export function badgeCategoryLabel(category: string): string {
  return BADGE_CATEGORY_LABEL[category] ?? category
}

/** Human-readable tier labels — geographic + academic (legacy) + SWE career ladder. */
export const BADGE_TIER_LABEL: Record<string, string> = {
  world: 'Mundial',
  mundial: 'Mundial',
  regional: 'Regional',
  national: 'Nacional',
  nacional: 'Nacional',
  local: 'Local',
  phd: 'Doctorado',
  doctorado: 'Doctorado',
  msc: 'Maestría',
  maestria: 'Maestría',
  bsc: 'Licenciatura',
  licenciatura: 'Licenciatura',
  intern: 'Intern',
  junior: 'Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
  distinguished: 'Distinguished',
}

/** Mono-style codes shown under the hex badge art. */
export const BADGE_TIER_CODE: Record<string, string> = {
  world: 'S',
  mundial: 'S',
  regional: 'A',
  national: 'B',
  nacional: 'B',
  local: 'C',
  phd: 'PHD',
  doctorado: 'PHD',
  msc: 'MSC',
  maestria: 'MSC',
  bsc: 'BSC',
  licenciatura: 'BSC',
  intern: 'INT',
  junior: 'JR',
  mid: 'MID',
  senior: 'SR',
  staff: 'STF',
  principal: 'PRIN',
  distinguished: 'DIA',
}

export const BADGE_TIER_PLACEHOLDER =
  'intern · junior · mid · senior · staff · principal · distinguished …'

export const BADGE_REQUIREMENTS_PLACEHOLDER =
  'GitHub, portfolio, certificación cloud, contribuciones open source, etc.'

export function formatBadgeTier(tier: string | null | undefined): string | null {
  if (!tier) return null
  return BADGE_TIER_LABEL[tier.toLowerCase().trim()] ?? tier
}

export function badgeTierCode(tier: string | null | undefined): string | null {
  if (!tier) return null
  const key = tier.toLowerCase().trim()
  return BADGE_TIER_CODE[key] ?? tier.toUpperCase().slice(0, 4)
}
