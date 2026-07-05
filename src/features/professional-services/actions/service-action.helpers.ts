import type {
  CreateProfessionalServiceDTO,
  PortfolioProject,
  UpdateProfessionalServiceDTO,
} from '../interfaces/professional-service.interfaces'

/**
 * Contrato de retorno de las Server Actions de escritura: los errores se
 * DEVUELVEN (nunca se lanzan a través de la frontera server/cliente) porque
 * Next.js redacta los mensajes de errores lanzados en producción. El facade
 * del cliente (`api/services.api.ts`) re-lanza el mensaje dentro de sus
 * mutationFns para que la UI de errores existente siga funcionando.
 */
export type ServiceActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

/** Input de creación + declaración de autonomía del prestador (Art. 12). */
export type CreateServiceActionInput = CreateProfessionalServiceDTO & {
  /**
   * Art. 12 (Manual de Convivencia): el prestador declara autonomía técnica y
   * administrativa antes de publicar. Se valida en el servidor y se persiste
   * como `provider_declaration_accepted_at` (timestamp de aceptación).
   */
  providerDeclarationAccepted?: boolean
}

/**
 * Patch de actualización aceptado por `updateServiceAction`. Igual que el DTO,
 * pero las tarifas admiten `null` como limpieza explícita del valor guardado
 * (`undefined` = no tocar).
 */
export type UpdateServicePatchInput = Omit<
  UpdateProfessionalServiceDTO,
  'hourlyRate' | 'dailyRate' | 'projectRate'
> & {
  hourlyRate?: number | null
  dailyRate?: number | null
  projectRate?: number | null
}

export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 100) || 'servicio'
  )
}

/** Pull the Cloudflare Images id out of a delivery URL (or pass through a bare id). */
export function extractCfImageId(value?: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('http') && !value.includes('/')) return value
  const m = value.match(/imagedelivery\.net\/[^/]+\/([^/?#]+)/)
  return m ? m[1] : null
}

/** Pull the Cloudflare Stream uid out of any of its URL shapes (or pass through a bare uid). */
export function extractStreamUid(value?: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('http') && !value.includes('/')) return value
  const m = value.match(/(?:iframe\.videodelivery\.net|videodelivery\.net|cloudflarestream\.com)\/([^/?#]+)/)
  return m ? m[1] : null
}

/**
 * Everything except `slug` — the slug is supplied per insert attempt so we can
 * recover from a unique-violation (RLS hides other users' non-public rows, so a
 * pre-check can't see every collision; also closes the check-then-insert race).
 */
export function buildServiceInsertPayload(
  userId: string,
  professionalProfileId: string | null | undefined,
  dto: CreateProfessionalServiceDTO,
): Record<string, unknown> {
  return {
    user_id: userId,
    professional_profile_id: professionalProfileId,
    name: dto.name.trim(),
    description: dto.description ?? null,
    category_id: dto.categoryId ?? null,
    city_id: dto.cityId ?? null,
    address: dto.address ?? null,
    email: dto.email ?? null,
    phone: dto.phone ?? null,
    website: dto.website ?? null,
    facebook_url: dto.facebookUrl ?? null,
    instagram_url: dto.instagramUrl ?? null,
    twitter_url: dto.twitterUrl ?? null,
    linkedin_url: dto.linkedinUrl ?? null,
    tiktok_url: dto.tiktokUrl ?? null,
    youtube_url: dto.youtubeUrl ?? null,
    hourly_rate: dto.hourlyRate ?? null,
    daily_rate: dto.dailyRate ?? null,
    project_rate: dto.projectRate ?? null,
    currency: dto.currency ?? 'COP',
    available_for_hire: dto.availableForHire ?? true,
    work_type: dto.workType ?? [],
    // Tags are lowercased so the case-insensitive tag search (cs operator) matches.
    tags: (dto.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    visibility: dto.visibility ?? 'PUBLIC',
    status: 'ACTIVE',
  }
}

export function buildServiceUpdatePatch(dto: UpdateServicePatchInput): Record<string, unknown> {
  const update: Record<string, unknown> = {}
  // `undefined` = "no tocar": solo se escriben las claves que el caller envió
  // explícitamente, así una actualización parcial nunca borra datos que no
  // incluyó. `null` (tarifas) y cadena vacía (textos) son limpiezas explícitas.
  const set = (key: string, value: unknown) => {
    if (value !== undefined) update[key] = value
  }
  const setText = (key: string, value: string | undefined) => {
    if (value !== undefined) update[key] = value.trim() === '' ? null : value
  }
  set('name', dto.name)
  setText('description', dto.description)
  set('category_id', dto.categoryId)
  set('city_id', dto.cityId)
  setText('address', dto.address)
  setText('email', dto.email)
  setText('phone', dto.phone)
  setText('website', dto.website)
  setText('facebook_url', dto.facebookUrl)
  setText('instagram_url', dto.instagramUrl)
  setText('twitter_url', dto.twitterUrl)
  setText('linkedin_url', dto.linkedinUrl)
  setText('tiktok_url', dto.tiktokUrl)
  setText('youtube_url', dto.youtubeUrl)
  set('hourly_rate', dto.hourlyRate)
  set('daily_rate', dto.dailyRate)
  set('project_rate', dto.projectRate)
  set('currency', dto.currency)
  set('available_for_hire', dto.availableForHire)
  set('work_type', dto.workType)
  set('visibility', dto.visibility)
  if (dto.tags !== undefined) update.tags = (dto.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean)
  if (dto.logoUrl !== undefined) update.logo_cf_image_id = extractCfImageId(dto.logoUrl)
  if (dto.coverUrl !== undefined) update.cover_cf_image_id = extractCfImageId(dto.coverUrl)
  if (dto.adImageUrl !== undefined) update.ad_cf_image_id = extractCfImageId(dto.adImageUrl)
  if (dto.cvUrl !== undefined) update.cv_cf_file_id = extractCfImageId(dto.cvUrl)
  if (dto.portfolioProjects !== undefined) {
    update.portfolio_projects = sanitizePortfolioProjects(dto.portfolioProjects)
  }
  return update
}

const MAX_PORTFOLIO_PROJECTS = 20

/**
 * Normaliza el portafolio antes de escribirlo en `portfolio_projects` (jsonb):
 * solo claves conocidas de `PortfolioProject`, título obligatorio, strings
 * recortados y tecnologías filtradas — así el JSON guardado nunca arrastra
 * campos extra del formulario.
 */
export function sanitizePortfolioProjects(projects: PortfolioProject[]): Record<string, unknown>[] {
  const cleanText = (value: string | undefined): string | undefined => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : undefined
  }
  return (projects ?? [])
    .filter((p) => typeof p?.title === 'string' && p.title.trim().length > 0)
    .slice(0, MAX_PORTFOLIO_PROJECTS)
    .map((p) => {
      const technologies = (p.technologies ?? [])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean)
      const project: Record<string, unknown> = { title: p.title.trim() }
      if (cleanText(p.description)) project.description = cleanText(p.description)
      if (cleanText(p.url)) project.url = cleanText(p.url)
      if (cleanText(p.githubUrl)) project.githubUrl = cleanText(p.githubUrl)
      if (cleanText(p.imageUrl)) project.imageUrl = cleanText(p.imageUrl)
      if (cleanText(p.startDate)) project.startDate = cleanText(p.startDate)
      if (cleanText(p.endDate)) project.endDate = cleanText(p.endDate)
      if (technologies.length > 0) project.technologies = technologies
      return project
    })
}

export interface AddServiceMediaInput {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  caption?: string
  order?: number
}
