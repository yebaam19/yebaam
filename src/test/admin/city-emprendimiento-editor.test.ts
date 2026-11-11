import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validAdminEmprendimiento, type AdminEmprendimientoInput } from '@/features/admin/lib/city-emprendimiento-input'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), image: vi.fn(), revalidate: vi.fn(), from: vi.fn(),
  select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn(), update: vi.fn(),
}))
vi.mock('@/features/admin/actions/_shared', () => ({
  requireAdminWithUser: mocks.auth, revalidateCityById: mocks.revalidate,
}))
vi.mock('@/lib/cloudflare/images', () => ({ getImageProvenance: mocks.image }))
import { saveCityEmprendimiento, loadCityEmprendimientoEditor } from '@/features/admin/actions/city-emprendimiento-editor.actions'

const input: AdminEmprendimientoInput = {
  id: '00000000-0000-4000-8000-000000000001', city_id: '00000000-0000-4000-8000-000000000002',
  name: 'Panadería', short_description: 'Pan artesanal', category: 'comida', story: '', zone: '',
  address: '', phone: '', whatsapp: '', hero_cf_image_id: null, owner_cf_image_id: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  const chain = { select: mocks.select, eq: mocks.eq, maybeSingle: mocks.maybeSingle,
    insert: mocks.insert, update: mocks.update }
  for (const method of [mocks.from, mocks.select, mocks.eq, mocks.insert, mocks.update]) method.mockReturnValue(chain)
  mocks.auth.mockResolvedValue({ client: { from: mocks.from }, userId: 'admin-user' })
})

describe('admin emprendimiento validation', () => {
  it('requires name, description, city and permitted category', () => {
    expect(validAdminEmprendimiento(input)).toBe(true)
    for (const patch of [{ name: ' ' }, { short_description: '' }, { city_id: 'bad' }, { category: 'bad' }, { story: 'x'.repeat(5001) }]) {
      expect(validAdminEmprendimiento({ ...input, ...patch })).toBe(false)
    }
  })
  it('rejects full media URLs and malformed values', () => {
    expect(validAdminEmprendimiento({ ...input, hero_cf_image_id: 'https://example.com/image' })).toBe(false)
    expect(validAdminEmprendimiento({ ...input, phone: null } as unknown as AdminEmprendimientoInput)).toBe(false)
  })
})

describe('admin emprendimiento writes', () => {
  it('cannot write without verified admin session', async () => {
    mocks.auth.mockResolvedValue({ client: {}, userId: null })
    expect(await saveCityEmprendimiento(input)).toEqual({ ok: false, error: 'unauthorized' })
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('preserves owner and status despite forged extra input', async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { ...input }, error: null })
      .mockResolvedValueOnce({ data: { id: input.id }, error: null })
    expect((await saveCityEmprendimiento({ ...input, owner_id: 'forged', status: 'APPROVED' } as AdminEmprendimientoInput)).ok).toBe(true)
    expect(mocks.update.mock.calls[0][0]).not.toHaveProperty('owner_id')
    expect(mocks.update.mock.calls[0][0]).not.toHaveProperty('status')
    expect(mocks.from.mock.calls.every(([table]) => table === 'city_emprendimientos')).toBe(true)
  })
  it('creates with stable id and session actor, leaving default pending status', async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: input.id }, error: null })
    expect((await saveCityEmprendimiento(input)).ok).toBe(true)
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ id: input.id, city_id: input.city_id, owner_id: 'admin-user' }))
    expect(mocks.insert.mock.calls[0][0]).not.toHaveProperty('status')
  })
  it('rejects edits crossing city boundaries', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { ...input, city_id: 'another-city' }, error: null })
    expect(await saveCityEmprendimiento(input)).toEqual({ ok: false, error: 'invalid_city' })
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('rejects images uploaded by another actor', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    mocks.image.mockResolvedValue({ ready: true, uploadedBy: 'someone-else', source: 'city-emprendimiento' })
    expect(await saveCityEmprendimiento({ ...input, hero_cf_image_id: '00000000-0000-4000-8000-000000000003' })).toEqual({ ok: false, error: 'invalid_image' })
    expect(mocks.insert).not.toHaveBeenCalled()
  })
  it('surfaces zero updated rows as failure', async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: input, error: null }).mockResolvedValueOnce({ data: null, error: null })
    expect(await saveCityEmprendimiento(input)).toEqual({ ok: false, error: 'save_failed' })
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })
  it('loads edits scoped to the selected city', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { ...input, story: null }, error: null })
    const result = await loadCityEmprendimientoEditor(input.city_id, input.id)
    expect(mocks.eq).toHaveBeenCalledWith('city_id', input.city_id)
    expect(result).toEqual({ ok: true, data: input })
  })
})
