import { z } from 'zod'

export const EVENT_STATUSES = ['draft', 'published', 'archived'] as const
export const eventStatusLabels = { draft: 'Borrador', published: 'Publicado', archived: 'Archivado' }
const instant = z.string().datetime({ offset: true })
export const cityEventSchema = z.object({
  id: z.string().uuid(),
  city_id: z.string().uuid(),
  title: z.string().trim().min(1).max(150),
  description: z.string().max(4000),
  venue: z.string().trim().min(1).max(300),
  starts_at: instant,
  ends_at: instant,
  time_zone: z.string().max(100).refine((value) => {
    try { new Intl.DateTimeFormat('es', { timeZone: value }); return true } catch { return false }
  }, 'Zona horaria inválida'),
  website: z.string().max(2048).refine((value) => {
    if (!value) return true
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password } catch { return false }
  }, 'Usa un enlace http o https'),
  cover_cf_image_id: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/).nullable(),
  status: z.enum(EVENT_STATUSES),
}).refine((value) => Date.parse(value.ends_at) > Date.parse(value.starts_at), {
  message: 'La finalización debe ser posterior al inicio', path: ['ends_at'],
})
export type CityEvent = z.infer<typeof cityEventSchema>
export const EVENT_SELECT = 'id, city_id, title, description, venue, starts_at, ends_at, time_zone, website, cover_cf_image_id, status'

export function formatEventDate(event: CityEvent, field: 'starts_at' | 'ends_at') {
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: event.time_zone }).format(new Date(event[field]))
}
