import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  gate: vi.fn(), from: vi.fn(), rpc: vi.fn(), revalidate: vi.fn(), insert: vi.fn(), update: vi.fn(),
  previous: null as null | Record<string, unknown>,
}))
vi.mock('@/features/admin/actions/_shared', () => ({
  requireAdminWithUser: h.gate, revalidateCityById: h.revalidate, slugify: () => 'servicio',
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
import { saveCityBusiness, saveCityService } from '@/features/admin/actions/city-commercial.actions'
import { SERVICE_CATEGORIES } from '@/features/professional-services/data/service-categories-taxonomy'

const input = { id: '11111111-1111-4111-8111-111111111111', cityId: '22222222-2222-4222-8222-222222222222',
  name: 'Servicio de ejemplo', description: '', address: '', phone: '', category: SERVICE_CATEGORIES[0].id,
  username: 'prestador', visibility: 'PRIVATE' as const }

beforeEach(() => {
  vi.clearAllMocks()
  h.previous = null
  h.gate.mockResolvedValue({ userId: 'admin', client: { from: h.from, rpc: h.rpc } })
  h.insert.mockResolvedValue({ error: null })
  h.from.mockImplementation((table: string) => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === 'profiles' ? { id: 'owner' } : h.previous, error: null }) }) }),
    insert: h.insert, update: h.update,
  }))
})

describe('City commercial admin boundaries', () => {
  it('never reaches database mutation after a rejected admin gate', async () => {
    h.gate.mockRejectedValue(new Error('forbidden'))
    await expect(saveCityService(input)).rejects.toThrow('forbidden')
    expect(h.from).not.toHaveBeenCalled()
  })
  it('creates a real private draft for the exact provider without fabricating consent', async () => {
    expect((await saveCityService(input)).ok).toBe(true)
    const row = h.insert.mock.calls[0][0]
    expect(row).toMatchObject({ user_id: 'owner', admin_created_by: 'admin', city_id: input.cityId, visibility: 'PRIVATE', status: 'PENDING_APPROVAL' })
    expect(row).not.toHaveProperty('provider_declaration_accepted_at')
    expect(row).not.toHaveProperty('provider_declaration_version')
  })
  it('rejects cross-city edits before writing', async () => {
    h.previous = { city_id: 'another-city', visibility: 'PRIVATE' }
    expect((await saveCityService(input)).ok).toBe(false)
    expect(h.update).not.toHaveBeenCalled()
  })
  it('does not let an administrator opt a private provider into public exposure', async () => {
    h.previous = { city_id: input.cityId, visibility: 'PRIVATE' }
    expect((await saveCityService({ ...input, visibility: 'PUBLIC' })).ok).toBe(false)
    expect(h.update).not.toHaveBeenCalled()
  })
  it('requires supplier disclosures before publishing a business', async () => {
    const result = await saveCityBusiness({ ...input, slug: 'ejemplo', legalName: '', taxId: '', pricesIncludeTax: false, active: true })
    expect(result.ok).toBe(false)
    expect(h.rpc).not.toHaveBeenCalled()
  })
})
