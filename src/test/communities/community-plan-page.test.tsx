import { beforeEach, expect, it, vi } from 'vitest';
import { CommunityPlanPage } from '@/features/communities/components/plans/CommunityPlanPage';

const mocks = vi.hoisted(() => ({ community: vi.fn(), sections: vi.fn(), capabilities: vi.fn(), migrated: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
vi.mock('@/features/communities/server/communities.server', () => ({ getCommunityBySlug: mocks.community }));
vi.mock('@/features/communities/server/community-plan.server', () => ({
  getCommunitySections: mocks.sections, getCommunityProfileCapabilities: mocks.capabilities,
  usesStructuredRules: mocks.migrated, getPlanAxes: vi.fn(), getPlanAxis: vi.fn(), getPlanPoints: vi.fn(),
}));
vi.mock('@/features/communities/components/plans/PlanWorkspace', () => ({ PlanWorkspace: () => null }));
vi.mock('@/features/communities/components/plans/PlanSectionSettings', () => ({ PlanSectionSettings: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.community.mockResolvedValue({ id: 'community', rules: [{ id: 'rule', title: 'Old', description: 'Hidden text', order: 0 }] });
  mocks.sections.mockResolvedValue([]);
  mocks.capabilities.mockResolvedValue({ settings: false, plans: false });
});

it('does not resurrect old rules when the structured section is hidden', async () => {
  mocks.migrated.mockResolvedValue(true);
  await expect(CommunityPlanPage({ slug: 'test', kind: 'rules' })).rejects.toThrow('NOT_FOUND');
});

it('preserves legacy reading before the owner imports its rules', async () => {
  mocks.migrated.mockResolvedValue(false);
  const result = await CommunityPlanPage({ slug: 'test', kind: 'rules' });
  expect(result.type).toBe('section');
});
