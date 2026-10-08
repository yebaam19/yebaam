import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPlanAxes, getPlanPoints } from '@/features/communities/server/community-plan.server';

const mocks = vi.hoisted(() => ({ client: vi.fn(), from: vi.fn(), rpc: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: mocks.client }));
const community = '11111111-1111-4111-8111-111111111111';
const section = '22222222-2222-4222-8222-222222222222';
const axis = '33333333-3333-4333-8333-333333333333';

function rowsResult(data: unknown[], error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve),
  };
  mocks.from.mockReturnValue(query);
  return query;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({ from: mocks.from, rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: [], error: null });
});

describe('bounded RLS-bound plan reads', () => {
  it('reads 31 records to return a 30-row page and a stable composite cursor', async () => {
    const rows = Array.from({ length: 31 }, (_, position) => ({ id: axis, position }));
    const query = rowsResult(rows);
    const result = await getPlanAxes(community, section);
    expect(result.items).toHaveLength(30);
    expect(result.nextCursor).toEqual({ position: 29, id: axis });
    expect(query.limit).toHaveBeenCalledWith(31);
    expect(query.eq.mock.calls).toEqual([['community_id', community], ['section_id', section]]);
  });

  it('rejects PostgREST cursor injection before constructing a client', async () => {
    await expect(getPlanAxes(community, section, JSON.stringify({ position: 0, id: 'x),id.neq.x' }))).rejects.toThrow();
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it('uses both order fields to paginate ties without offsets', async () => {
    const query = rowsResult([]);
    const result = await getPlanPoints(community, section, axis, JSON.stringify({ position: 3, id: axis }));
    expect(query.or).toHaveBeenCalledWith(`position.gt.3,and(position.eq.3,id.gt.${axis})`);
    expect(query.eq).toHaveBeenCalledWith('axis_id', axis);
    expect(result).toEqual({ items: [], nextCursor: null });
  });

  it('sanitizes content written through other database clients on read too', async () => {
    rowsResult([{ id: axis, position: 0, content: '<p>Hello</p><img src="https://test/x" onerror="x()"><script>x()</script>' }]);
    const result = await getPlanPoints(community, section, axis);
    expect(result.items[0].content).toBe('<p>Hello</p>');
  });

  it('batches previews for only the visible page and preserves the extra-row cursor', async () => {
    rowsResult(Array.from({ length: 31 }, (_, position) => ({ id: axis, position, content: '' })));
    mocks.rpc.mockResolvedValue({ data: [{ point_id: axis, items: [0, 1, 2, 3].map((position) => ({ id: axis, position })) }], error: null });
    const result = await getPlanPoints(community, section, axis);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('community_plan_attachment_previews', { target_community: community, point_ids: Array(30).fill(axis) });
    expect(result.items[0].attachments?.items).toHaveLength(3);
    expect(result.items[0].attachments?.nextCursor).toEqual({ id: axis, position: 2 });
    expect(result.nextCursor).toEqual({ id: axis, position: 29 });
  });

  it('surfaces failed previews instead of silently omitting files', async () => {
    rowsResult([{ id: axis, position: 0, content: '' }]);
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '503' } });
    await expect(getPlanPoints(community, section, axis)).rejects.toThrow('No se pudieron cargar los adjuntos.');
  });

  it('preserves backend failures as errors instead of showing an empty plan', async () => {
    rowsResult([], { code: '503' });
    await expect(getPlanAxes(community, section)).rejects.toThrow('No se pudieron cargar los ejes.');
  });
});
