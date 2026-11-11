import { beforeEach, expect, it, vi } from 'vitest';
import { createCity } from '@/features/admin/actions/cities.actions';

const { rpc, requireAdmin, revalidateCityList } = vi.hoisted(() => ({
  rpc: vi.fn(), requireAdmin: vi.fn(), revalidateCityList: vi.fn(),
}));
vi.mock('@/features/admin/actions/_shared', () => ({
  requireAdmin,
  revalidateCityList,
  revalidateCity: vi.fn(),
  slugify: (name: string) => name.toLowerCase(),
  validateSlug: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue({ client: { rpc } });
});

const input = { name: ' Miami ', slug: 'miami', countryId: 'us-id' };

it('creates city and forum through one caller-bound atomic RPC', async () => {
  rpc.mockResolvedValue({ data: { id: 'city-id', slug: 'miami' }, error: null });
  expect(await createCity(input)).toEqual({ ok: true, data: { id: 'city-id', slug: 'miami' } });
  expect(rpc).toHaveBeenCalledExactlyOnceWith('create_city_with_forum', {
    p_name: 'Miami', p_slug: 'miami', p_country_id: 'us-id', p_state_id: null,
  });
  expect(revalidateCityList).toHaveBeenCalledOnce();
});

it('returns a provisioning failure without reporting success or refreshing the list', async () => {
  rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'forum denied' } });
  expect(await createCity(input)).toEqual({ ok: false, error: 'forum denied' });
  expect(revalidateCityList).not.toHaveBeenCalled();
});

it('maps uniqueness conflicts to the actionable slug collision message', async () => {
  rpc.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } });
  expect(await createCity(input)).toEqual({ ok: false, error: 'slug_taken' });
  expect(revalidateCityList).not.toHaveBeenCalled();
});

it('never calls the RPC when the admin guard rejects the caller', async () => {
  requireAdmin.mockRejectedValue(new Error('Unauthorized'));
  await expect(createCity(input)).rejects.toThrow('Unauthorized');
  expect(rpc).not.toHaveBeenCalled();
});
