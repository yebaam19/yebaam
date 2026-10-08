import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePlanItem, deletePlanItem, movePlanItem } from '@/features/communities/actions/plans/content.actions';
import { saveCommunitySection } from '@/features/communities/actions/plans/sections.actions';

const mocks = vi.hoisted(() => ({
  session: vi.fn(), rpc: vi.fn(), from: vi.fn(), revalidate: vi.fn(),
}));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

const id = '11111111-1111-4111-8111-111111111111';
const sectionId = '22222222-2222-4222-8222-222222222222';
const axisId = '33333333-3333-4333-8333-333333333333';
const point = { communityId: id, sectionId, axisId, id, kind: 'point', title: 'Empleo' };

function writeResult(data: unknown, error: unknown = null) {
  const query = {
    insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  mocks.from.mockReturnValue(query);
  return query;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: id, client: { rpc: mocks.rpc, from: mocks.from } });
  mocks.rpc.mockResolvedValue({ data: { settings: true, plans: true }, error: null });
});

describe('plan mutation boundaries', () => {
  it('rejects invalid and oversized input before touching the backend', async () => {
    expect((await savePlanItem({ ...point, communityId: 'x' })).ok).toBe(false);
    expect((await savePlanItem({ ...point, content: '🙂'.repeat(50001) })).ok).toBe(false);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('requires a verified session and a plan grant', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await savePlanItem(point)).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: { plans: false }, error: null });
    expect((await savePlanItem(point)).ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('fails closed when the permission lookup fails', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '503' } });
    expect((await savePlanItem(point)).ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('saves only sanitized text and defaults new points to draft', async () => {
    const query = writeResult({ id, version: 1 });
    const result = await savePlanItem({
      ...point, content: '<p onclick="x()">Trabajo <strong>digno</strong></p><img src="https://evil.test/x"><script>x()</script>',
    });
    expect(result.ok).toBe(true);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      community_id: id, section_id: sectionId, axis_id: axisId,
      content: '<p>Trabajo <strong>digno</strong></p>', is_published: false,
    }));
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades/[slug]', 'layout');
  });

  it('scopes edits by tenant, section, identity and expected version', async () => {
    const query = writeResult(null);
    const result = await savePlanItem({ ...point, expectedVersion: 3 });
    expect(result.ok).toBe(false);
    expect(query.eq.mock.calls).toEqual([
      ['id', id], ['community_id', id], ['section_id', sectionId], ['version', 3],
    ]);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('keeps create retry conflicts explicit without duplicating or retrying the write', async () => {
    const query = writeResult(null, { code: '23505' });
    expect((await savePlanItem(point)).ok).toBe(false);
    expect(query.insert).toHaveBeenCalledTimes(1);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('requires confirmation and version for deletion', async () => {
    expect((await deletePlanItem({ ...point, expectedVersion: 1 })).ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
    const query = writeResult({ id });
    expect((await deletePlanItem({ ...point, expectedVersion: 1, confirmed: true })).ok).toBe(true);
    expect(query.eq).toHaveBeenCalledWith('version', 1);
  });

  it('delegates reorder atomically with explicit tenant and version', async () => {
    const result = await movePlanItem({ ...point, expectedVersion: 2, destinationAxis: axisId });
    expect(result.ok).toBe(true);
    expect(mocks.rpc).toHaveBeenLastCalledWith('move_community_plan_item', {
      target_community: id, target_section: sectionId, entity_kind: 'point', entity_id: id,
      expected_version: 2, destination_axis: axisId, before_id: null,
    });
  });

  it('does not let a plan editor rename or reveal sections', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: { plans: true, settings: false }, error: null });
    expect((await saveCommunitySection({ communityId: id, id, kind: 'government', title: 'Plan' })).ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('returns a typed failure for a network exception', async () => {
    mocks.session.mockRejectedValueOnce(new Error('private server details'));
    const result = await savePlanItem(point);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain('private server details');
  });
});
