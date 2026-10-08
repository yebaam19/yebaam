import { beforeEach, expect, it, vi } from 'vitest';
import { CommunityLeadersPage, CommunityLeaderPage } from '@/features/communities/components/leaders/CommunityLeadersPage';
const mocks = vi.hoisted(() => ({ community: vi.fn(), sections: vi.fn(), capabilities: vi.fn(), categories: vi.fn(), category: vi.fn(), leaders: vi.fn(), leader: vi.fn(), contacts: vi.fn(), media: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('@/features/communities/server/communities.server', () => ({ getCommunityBySlug: mocks.community }));
vi.mock('@/features/communities/server/community-plan.server', () => ({ getCommunitySections: mocks.sections, getCommunityProfileCapabilities: mocks.capabilities }));
vi.mock('@/features/communities/server/community-leaders.server', () => ({ getLeaderCategories: mocks.categories, getLeaderCategory: mocks.category, getCommunityLeaders: mocks.leaders, getCommunityLeader: mocks.leader, getLeaderContacts: mocks.contacts, getLeaderMedia: mocks.media }));
vi.mock('@/features/communities/components/leaders/LeadersWorkspace', () => ({ LeadersWorkspace: () => null }));
vi.mock('@/features/communities/components/leaders/LeaderDetailWorkspace', () => ({ LeaderDetailWorkspace: () => null }));
const id = '11111111-1111-4111-8111-111111111111';
const leaderId = '22222222-2222-4222-8222-222222222222';
beforeEach(() => {
  vi.resetAllMocks(); mocks.community.mockResolvedValue({ id }); mocks.sections.mockResolvedValue([]);
  mocks.capabilities.mockResolvedValue({ settings: false, content: false });
  mocks.categories.mockResolvedValue({ items: [], nextCursor: null }); mocks.leaders.mockResolvedValue({ items: [], nextCursor: null });
});
it('does not expose the workspace when RLS hides the section', async () => {
  await expect(CommunityLeadersPage({ slug: 'test' })).rejects.toThrow('NOT_FOUND');
  expect(mocks.leaders).not.toHaveBeenCalled();
});
it('allows settings administrators to prepare a missing section without reading an unscoped list', async () => {
  mocks.capabilities.mockResolvedValue({ settings: true, content: true });
  const page = await CommunityLeadersPage({ slug: 'test' }); expect(page.props.section).toBeUndefined();
  expect(mocks.leaders).not.toHaveBeenCalled();
});
it('rejects malformed and invisible category filters', async () => {
  await expect(CommunityLeadersPage({ slug: 'test', category: 'bad' })).rejects.toThrow('NOT_FOUND');
  mocks.sections.mockResolvedValue([{ id, kind: 'leaders' }]); mocks.category.mockResolvedValue(null);
  await expect(CommunityLeadersPage({ slug: 'test', category: leaderId })).rejects.toThrow('NOT_FOUND');
  expect(mocks.leaders).toHaveBeenCalledWith(id, id, leaderId);
});
it('scopes direct detail URLs to their community and does not read contacts for a missing leader', async () => {
  mocks.leader.mockResolvedValue(null);
  await expect(CommunityLeaderPage({ slug: 'test', leaderId })).rejects.toThrow('NOT_FOUND');
  expect(mocks.leader).toHaveBeenCalledWith(id, leaderId); expect(mocks.contacts).not.toHaveBeenCalled();
  await expect(CommunityLeaderPage({ slug: 'test', leaderId: 'invalid' })).rejects.toThrow('NOT_FOUND');
});
