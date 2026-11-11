import { beforeEach, expect, it, vi } from 'vitest'
import { saveCityEvent } from '@/features/admin/actions/city-events.actions'
import type { CityEvent } from '@/features/cities/events/types'

const { guard, provenance, refresh, from, upsert, single } = vi.hoisted(() => ({
  guard: vi.fn(), provenance: vi.fn(), refresh: vi.fn(), from: vi.fn(), upsert: vi.fn(), single: vi.fn(),
}))
vi.mock('@/features/admin/actions/_shared', () => ({ requireAdminWithUser: guard, revalidateCityById: refresh }))
vi.mock('@/lib/cloudflare/images', () => ({ getImageProvenance: provenance }))
const input: CityEvent = {
  id: '22b454b3-a5b3-4ad3-9d4c-e5e486c5dd8d', city_id: '3a8cf22e-69e8-42e3-8fe0-6092207e7d7f',
  title: 'Feria', description: '', venue: 'Plaza', starts_at: '2026-12-01T15:00:00Z', ends_at: '2026-12-01T17:00:00Z',
  time_zone: 'America/Chicago', website: '', cover_cf_image_id: null, status: 'draft',
}
beforeEach(() => {
  vi.clearAllMocks()
  const query = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: single, upsert }
  from.mockReturnValue(query)
  guard.mockResolvedValue({ client: { from }, userId: 'admin-user' })
  single.mockResolvedValue({ data: null, error: null })
  upsert.mockResolvedValue({ error: null })
})
it('saves the same event id across retries and refreshes the city calendar', async () => {
  expect(await saveCityEvent(input)).toEqual({ ok: true, data: { id: input.id } })
  expect(upsert).toHaveBeenCalledWith(input, { onConflict: 'id' })
  expect(refresh).toHaveBeenCalledWith(expect.anything(), input.city_id, ['events'])
})
it('does not access data before authorization', async () => {
  guard.mockRejectedValue(new Error('Unauthorized'))
  await expect(saveCityEvent(input)).rejects.toThrow('Unauthorized')
  expect(from).not.toHaveBeenCalled()
})
it('does not move an existing event to a different city', async () => {
  single.mockResolvedValue({ data: { city_id: 'other-city' }, error: null })
  expect((await saveCityEvent(input)).ok).toBe(false)
  expect(upsert).not.toHaveBeenCalled()
})
it('rejects images uploaded by another user', async () => {
  provenance.mockResolvedValue({ ready: true, requiresSignature: false, uploadedBy: 'other-user', source: 'city-event' })
  expect((await saveCityEvent({ ...input, cover_cf_image_id: 'd8b5cef5-2f93-4f1e-88ba-e220c4e917f6' })).ok).toBe(false)
  expect(upsert).not.toHaveBeenCalled()
})
it('keeps database failure visible without reporting success', async () => {
  upsert.mockResolvedValue({ error: { message: 'unavailable' } })
  expect((await saveCityEvent(input)).ok).toBe(false)
  expect(refresh).not.toHaveBeenCalled()
})
