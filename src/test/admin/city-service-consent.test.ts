import { beforeEach, describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({ client: vi.fn(), eligibility: vi.fn(), update: vi.fn(), rpc: vi.fn(), eq: vi.fn(), not: vi.fn(), is: vi.fn(), select: vi.fn(), single: vi.fn() }))
vi.mock('@/utils/supabase/server', () => ({ getServerClient: h.client }))
vi.mock('@/features/professional-services/server/eligibility.server', () => ({ getMyServiceEligibility: h.eligibility }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
import { acceptCityServiceDraft } from '@/features/professional-services/actions/city-draft.actions'
const id = '11111111-1111-4111-8111-111111111111'
beforeEach(() => {
  vi.clearAllMocks()
  const chain = { eq: h.eq, not: h.not, is: h.is, select: h.select, maybeSingle: h.single }
  for (const mock of [h.update, h.eq, h.not, h.is, h.select]) mock.mockReturnValue(chain)
  h.single.mockResolvedValue({ data: { id }, error: null })
  h.rpc.mockResolvedValue({ data: id, error: null })
  h.client.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, from: () => ({ update: h.update }), rpc: h.rpc })
  h.eligibility.mockResolvedValue({ eligible: true, professionalProfileId: 'profile' })
})
describe('Professional provider personal consent', () => {
  it('rejects missing explicit acceptance without touching the database', async () => {
    expect((await acceptCityServiceDraft(id, false)).ok).toBe(false)
    expect(h.client).not.toHaveBeenCalled()
  })
  it('does not publish for an unverified provider', async () => {
    h.eligibility.mockResolvedValue({ eligible: false })
    expect((await acceptCityServiceDraft(id, true)).ok).toBe(false)
    expect(h.update).not.toHaveBeenCalled()
  })
  it('binds acceptance to the verified session owner and a still-pending admin draft', async () => {
    expect((await acceptCityServiceDraft(id, true)).ok).toBe(true)
    expect(h.rpc).toHaveBeenCalledWith('accept_city_service_draft', { p_id: id, p_accepted: true })
    expect(h.update).not.toHaveBeenCalled()
  })
  it('does not report success if the owner-scoped write matched no draft', async () => {
    h.rpc.mockResolvedValue({ data: null, error: null })
    expect((await acceptCityServiceDraft(id, true)).ok).toBe(false)
  })
})
