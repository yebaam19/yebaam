import { describe, expect, it } from 'vitest'
import { cityEventSchema, type CityEvent } from '@/features/cities/events/types'

const event: CityEvent = {
  id: '22b454b3-a5b3-4ad3-9d4c-e5e486c5dd8d', city_id: '3a8cf22e-69e8-42e3-8fe0-6092207e7d7f',
  title: 'Feria local', description: '', venue: 'Plaza municipal',
  starts_at: '2026-12-01T15:00:00Z', ends_at: '2026-12-01T17:00:00Z', time_zone: 'America/Chicago',
  website: '', cover_cf_image_id: null, status: 'draft',
}
describe('city event validation', () => {
  it('accepts a private draft with a real time zone', () => expect(cityEventSchema.safeParse(event).success).toBe(true))
  it('rejects end before or at start', () => {
    expect(cityEventSchema.safeParse({ ...event, ends_at: event.starts_at }).success).toBe(false)
    expect(cityEventSchema.safeParse({ ...event, ends_at: '2026-11-01T17:00:00Z' }).success).toBe(false)
  })
  it('rejects invalid zones and instants without offsets', () => {
    expect(cityEventSchema.safeParse({ ...event, time_zone: 'Texas' }).success).toBe(false)
    expect(cityEventSchema.safeParse({ ...event, starts_at: '2026-12-01T15:00' }).success).toBe(false)
  })
  it('rejects executable URLs, credentials, media URLs and unexpected statuses', () => {
    for (const website of ['javascript:alert(1)', 'https://user:secret@example.com']) expect(cityEventSchema.safeParse({ ...event, website }).success).toBe(false)
    expect(cityEventSchema.safeParse({ ...event, cover_cf_image_id: 'https://example.com/a.jpg' }).success).toBe(false)
    expect(cityEventSchema.safeParse({ ...event, status: 'approved' }).success).toBe(false)
  })
})
