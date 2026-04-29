import type {
  CredentialStatus,
  Study,
  StudyType,
  Title,
  TitleCategory,
  TitleDistinction,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces'

export const CATEGORY_OPTIONS: TitleCategory[] = [
  'bachiller',
  'tecnico',
  'tecnologo',
  'asociado',
  'licenciatura',
  'maestria',
  'doctorado',
]

export const DISTINCTION_OPTIONS: TitleDistinction[] = [
  'cum_laude',
  'magna_cum_laude',
  'summa_cum_laude',
  'mejor_estudiante',
  'segundo_mejor_estudiante',
  'tercer_mejor_estudiante',
]

export const STUDY_TYPE_OPTIONS: StudyType[] = [
  'certificado',
  'diploma',
  'diplomado',
  'curso',
  'bootcamp',
]

const CATEGORY_LABEL: Record<TitleCategory, string> = {
  bachiller: 'Bachiller',
  tecnico: 'Técnico',
  tecnologo: 'Tecnólogo',
  asociado: 'Asociado',
  licenciatura: 'Licenciatura',
  maestria: 'Maestría',
  doctorado: 'Doctorado',
}

const DISTINCTION_LABEL: Record<TitleDistinction, string> = {
  cum_laude: 'cum laude',
  magna_cum_laude: 'magna cum laude',
  summa_cum_laude: 'summa cum laude',
  mejor_estudiante: 'mejor estudiante',
  segundo_mejor_estudiante: 'segundo mejor estudiante',
  tercer_mejor_estudiante: 'tercer mejor estudiante',
}

const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  certificado: 'Certificado',
  diploma: 'Diploma',
  diplomado: 'Diplomado',
  curso: 'Curso',
  bootcamp: 'Bootcamp',
}

export function categoryLabel(c: TitleCategory | null | undefined): string {
  return c ? CATEGORY_LABEL[c] : ''
}

export function distinctionLabel(d: TitleDistinction | null | undefined): string {
  return d ? DISTINCTION_LABEL[d] : ''
}

export function studyTypeLabel(s: StudyType | null | undefined): string {
  return s ? STUDY_TYPE_LABEL[s] : ''
}

// Only licenciatura, maestria, doctorado earn a public badge in v1.
const BADGE_RANK: Record<TitleCategory, number> = {
  bachiller: 0,
  tecnico: 0,
  tecnologo: 0,
  asociado: 0,
  licenciatura: 1,
  maestria: 2,
  doctorado: 3,
}

const ELIGIBLE: TitleCategory[] = ['licenciatura', 'maestria', 'doctorado']

export function isBadgeEligible(category: TitleCategory | null | undefined): boolean {
  return !!category && ELIGIBLE.includes(category)
}

export function getHighestVerifiedDegree(
  titles: Title[] | undefined,
): TitleCategory | null {
  if (!titles || titles.length === 0) return null
  let best: TitleCategory | null = null
  let bestRank = 0
  for (const t of titles) {
    if (t.credentialStatus !== 'approved' || !t.category) continue
    if (!isBadgeEligible(t.category)) continue
    const rank = BADGE_RANK[t.category]
    if (rank > bestRank) {
      bestRank = rank
      best = t.category
    }
  }
  return best
}

export function getVerifiedDegrees(titles: Title[] | undefined): TitleCategory[] {
  if (!titles) return []
  const set = new Set<TitleCategory>()
  for (const t of titles) {
    if (t.credentialStatus === 'approved' && t.category && isBadgeEligible(t.category)) {
      set.add(t.category)
    }
  }
  // Display order: doctorado, maestria, licenciatura
  return ['doctorado', 'maestria', 'licenciatura'].filter((c) => set.has(c as TitleCategory)) as TitleCategory[]
}

export function isVerified(item: Pick<Title | Study, 'credentialStatus'>): boolean {
  return item.credentialStatus === 'approved'
}

const CRED_STATUS_LABEL: Record<CredentialStatus, string> = {
  none: 'Sin verificar',
  pending: 'Pendiente de verificación',
  approved: 'Verificado',
  rejected: 'Verificación rechazada',
  review_needed: 'Revisión por edición',
}

export function credentialStatusLabel(s: CredentialStatus): string {
  return CRED_STATUS_LABEL[s]
}

export function composeTitleLine(t: Title): string {
  const cat = categoryLabel(t.category)
  const dist = distinctionLabel(t.distinction)
  const parts: string[] = []
  if (cat) parts.push(`${cat} en ${t.name}`)
  else parts.push(t.name)
  if (dist) parts.push(dist)
  if (t.institution) parts.push(t.institution)
  if (t.year) parts.push(String(t.year))
  return parts.join(', ')
}

export function composeStudyLine(s: Study): string {
  const type = studyTypeLabel(s.studyType)
  const parts: string[] = []
  if (type) parts.push(`${type}: ${s.name}`)
  else parts.push(s.name)
  if (s.institution) parts.push(s.institution)
  if (s.year) parts.push(String(s.year))
  return parts.join(', ')
}
