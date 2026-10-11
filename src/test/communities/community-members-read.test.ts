import { beforeEach, expect, it, vi } from 'vitest';
import { getCommunityMembers } from '@/features/communities/server/communities/communities-members.server';

const mocks = vi.hoisted(() => ({ from: vi.fn(), client: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: mocks.client }));

type QueryError = { code: string; message: string; details: string; hint: string };
type Result = { data: unknown[] | null; count: number | null; error: QueryError | null; status: number };
const success = (data: unknown[] = [], count = data.length): Result => ({ data, count, error: null, status: 200 });
const error = (code: string, status = 403): Result => ({
  data: null, count: null, status,
  error: { code, message: 'Database failure', details: 'Specific failure details', hint: 'Diagnostic hint' },
});
const exhausted = () => error('PGRST103', 416);
const member = (n: number) => ({ community_id: 'community-id', user_id: `user-${n}`, role: 'MEMBER', status: 'active', joined_at: '2026-10-11T00:00:00Z' });

function queue(...results: Result[]) {
  const queries = results.map((result) => ({
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue(result),
    in: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject),
  }));
  for (const query of queries) mocks.from.mockReturnValueOnce(query);
  return queries;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({ from: mocks.from });
});

it('loads consecutive ranges without dropping or repeating members and uses stable ordering', async () => {
  const first = Array.from({ length: 60 }, (_, n) => member(n));
  const second = Array.from({ length: 5 }, (_, n) => member(n + 60));
  const [page1, , page2] = queue(success(first, 65), success(), success(second, 65), success());
  const a = await getCommunityMembers('community-id', { page: 1, limit: 60 });
  const b = await getCommunityMembers('community-id', { page: 2, limit: 60 });
  expect(page1.range).toHaveBeenCalledWith(0, 59);
  expect(page2.range).toHaveBeenCalledWith(60, 119);
  expect(page2.order.mock.calls).toEqual([['joined_at', { ascending: true }], ['user_id', { ascending: true }]]);
  expect(new Set([...a.members, ...b.members].map((m) => m.userId)).size).toBe(65);
  expect(b).toMatchObject({ total: 65, page: 2 });
});

it('recovers a stale page using a fresh count with the same session and visibility filters', async () => {
  const [requested, count, recovered] = queue(exhausted(), success([], 3), success([member(1)], 3), success());
  const result = await getCommunityMembers('community-id', { page: 2, limit: 60 });
  expect(requested.range).toHaveBeenCalledWith(60, 119);
  expect(count.select).toHaveBeenCalledWith('user_id', { count: 'exact', head: true });
  for (const query of [requested, count, recovered]) {
    expect(query.eq.mock.calls).toEqual([['community_id', 'community-id'], ['status', 'active']]);
  }
  expect(recovered.range).toHaveBeenCalledWith(0, 59);
  expect(result).toMatchObject({ total: 3, page: 1 });
  expect(mocks.client).toHaveBeenCalledTimes(1);
});

it('recovers the last remaining page instead of always returning to page one', async () => {
  const [, , recovered] = queue(exhausted(), success([], 65), success([member(64)], 65), success());
  expect(await getCommunityMembers('community-id', { page: 3, limit: 60 })).toMatchObject({ page: 2 });
  expect(recovered.range).toHaveBeenCalledWith(60, 119);
});

it('returns an empty first page when every visible member has disappeared', async () => {
  queue(exhausted(), success([], 0));
  expect(await getCommunityMembers('community-id', { page: 2, limit: 60 })).toEqual({ members: [], total: 0, page: 1 });
  expect(mocks.from).toHaveBeenCalledTimes(2);
});

it('does not query profiles for a genuinely empty community', async () => {
  queue(success());
  expect(await getCommunityMembers('community-id')).toEqual({ members: [], total: 0, page: 1 });
  expect(mocks.from).toHaveBeenCalledExactlyOnceWith('community_members');
});

it.each(['42501', 'PGRST200', 'PGRST201'])('preserves %s diagnostics instead of treating a failed read as empty', async (code) => {
  const failure = error(code);
  queue(failure);
  const thrown = await getCommunityMembers('community-id').catch((err: Error) => err);
  expect(thrown).toBeInstanceOf(Error);
  const cause = (thrown as Error).cause as Error;
  expect(cause.name).toBe(code);
  expect(cause.message).toContain('HTTP 403');
  expect(cause.message).toContain(failure.error?.details);
  expect(cause.cause).toBe(failure.error);
  expect(mocks.from).toHaveBeenCalledTimes(1);
});

it('preserves a failed recount and stops recovery', async () => {
  const failure = error('42501');
  queue(exhausted(), failure);
  await expect(getCommunityMembers('community-id', { page: 2 })).rejects.toMatchObject({
    message: 'No se pudo contar la lista de miembros.', cause: { name: '42501', cause: failure.error },
  });
  expect(mocks.from).toHaveBeenCalledTimes(2);
});

it('stops after one recovery if the range disappears again', async () => {
  queue(exhausted(), success([], 65), exhausted());
  await expect(getCommunityMembers('community-id', { page: 3, limit: 60 })).rejects.toMatchObject({ cause: { name: 'PGRST103' } });
  expect(mocks.from).toHaveBeenCalledTimes(3);
});

it('preserves profile query failures', async () => {
  const failure = error('42501');
  queue(success([member(1)]), failure);
  await expect(getCommunityMembers('community-id')).rejects.toMatchObject({
    message: 'No se pudieron cargar los perfiles de miembros.', cause: { name: '42501', cause: failure.error },
  });
});

it.each([{ page: 0 }, { page: 1.5 }, { page: NaN }, { page: 1001 }, { limit: 0 }, { limit: 61 }, { limit: Infinity }])('rejects invalid ranges before reaching Supabase: %j', async (opts) => {
  await expect(getCommunityMembers('community-id', opts)).rejects.toBeInstanceOf(RangeError);
  expect(mocks.client).not.toHaveBeenCalled();
});
