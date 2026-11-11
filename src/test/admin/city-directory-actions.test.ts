import { beforeEach, expect, it, vi } from 'vitest'
import { saveCityDirectoryEntry } from '@/features/admin/actions/city-directory.actions'
import type { DirectoryInput } from '@/features/cities/directory/types'

const { guard, provenance, refresh, from, upsert, single } = vi.hoisted(() => ({
  guard: vi.fn(), provenance: vi.fn(), refresh: vi.fn(), from: vi.fn(), upsert: vi.fn(), single: vi.fn(),
}))
vi.mock('@/features/admin/actions/_shared', () => ({ requireAdminWithUser: guard, revalidateCityById: refresh }))
vi.mock('@/lib/cloudflare/images', () => ({ getImageProvenance: provenance }))
const input: DirectoryInput = {
  id: 'e441b099-d4fd-4ba9-acf3-942de3935f0a', city_id: '37407eb6-2135-4ac2-9637-e41d6e112256',
  category: 'food', name: ' Restaurant ', description: '', address: '', phone: '', website: '',
  cover_cf_image_id: null, status: 'draft',
}
beforeEach(() => {
  vi.clearAllMocks()
  const query = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: single, upsert }
  from.mockReturnValue(query)
  guard.mockResolvedValue({ client: { from }, userId: 'admin-user' })
  single.mockResolvedValueOnce({ data: { id: 'category-id' }, error: null })
    .mockResolvedValueOnce({ data: null, error: null })
  upsert.mockResolvedValue({ error: null })
})
it('uses a stable id and caller-bound upsert, revalidating the public category only after success', async () => {
  expect(await saveCityDirectoryEntry(input)).toEqual({ ok: true, data: { id: input.id } })
  expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: input.id, name: 'Restaurant', status: 'draft' }), { onConflict: 'id' })
  expect(refresh).toHaveBeenCalledWith(expect.anything(), input.city_id, ['directory/food'])
})
it('stops before database or image access when administrator authorization fails', async () => {
  guard.mockRejectedValue(new Error('Unauthorized'))
  await expect(saveCityDirectoryEntry(input)).rejects.toThrow('Unauthorized')
  expect(from).not.toHaveBeenCalled()
  expect(provenance).not.toHaveBeenCalled()
})
it('rejects a replacement image uploaded by another person', async () => {
  provenance.mockResolvedValue({ ready: true, requiresSignature: false, uploadedBy: 'other-user', source: 'city-directory' })
  expect(await saveCityDirectoryEntry({ ...input, cover_cf_image_id: 'd8b5cef5-2f93-4f1e-88ba-e220c4e917f6' })).toEqual({ ok: false, error: 'invalid_image' })
  expect(upsert).not.toHaveBeenCalled()
})
it('does not report success or revalidate when Supabase rejects the save', async () => {
  upsert.mockResolvedValue({ error: { message: 'unavailable' } })
  expect(await saveCityDirectoryEntry(input)).toEqual({ ok: false, error: 'save_failed' })
  expect(refresh).not.toHaveBeenCalled()
})
