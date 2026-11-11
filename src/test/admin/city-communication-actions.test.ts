import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), rpc: vi.fn(), from: vi.fn(), revalidate: vi.fn() }))
vi.mock('@/features/admin/actions/_shared', () => ({ requireAdmin: mocks.requireAdmin, revalidateCityById: mocks.revalidate }))
import { provisionCityCommunication, saveCityChat } from '@/features/admin/actions/city-communication.actions'

const cityId = '12d8a431-36bf-4c6d-a49d-c1ab81e37f20'
const topicId = '12d8a431-36bf-4c6d-a49d-c1ab81e37f21'
const input = { cityId, topicId, name: 'Comunidad', description: 'Conversemos', capacity: 250, archived: false }

describe('city communication admin boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdmin.mockResolvedValue({ client: { rpc: mocks.rpc, from: mocks.from } })
  })
  it('rejects a caller before any provisioning query', async () => {
    mocks.requireAdmin.mockRejectedValue(new Error('unauthorized'))
    await expect(provisionCityCommunication(cityId)).rejects.toThrow('unauthorized')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('uses one atomic city provisioning RPC', async () => {
    mocks.rpc.mockResolvedValue({ error: null })
    expect(await provisionCityCommunication(cityId)).toEqual({ ok: true })
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('ensure_city_communication', { p_city_id: cityId })
  })
  it('rejects invalid capacity before writing', async () => {
    expect((await saveCityChat({ ...input, capacity: 501 })).ok).toBe(false)
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('scopes a room update to the city and fails if no row matches', async () => {
    const query = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
    mocks.from.mockReturnValue(query)
    expect((await saveCityChat(input)).ok).toBe(false)
    expect(query.eq).toHaveBeenCalledWith('city_id', cityId)
    expect(query.eq).toHaveBeenCalledWith('owner_type', 'city')
    expect(query.is).toHaveBeenCalledWith('parent_topic_id', null)
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })
})
