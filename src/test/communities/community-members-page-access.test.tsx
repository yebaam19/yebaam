import type { ReactElement } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import CommunityMembersPage from '@/app/(app)/feed/comunidades/[slug]/miembros/page';

const mocks = vi.hoisted(() => ({ community: vi.fn(), members: vi.fn(), capabilities: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('@/features/communities/server/communities.server', () => ({
  getCommunityBySlug: mocks.community, getCommunityMembers: mocks.members,
}));
vi.mock('@/features/communities/server/community-plan.server', () => ({
  getCommunityProfileCapabilities: mocks.capabilities,
}));

const params = Promise.resolve({ slug: 'qa' });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.community.mockResolvedValue({ id: 'community-id', stats: { membersCount: 12 } });
  mocks.members.mockResolvedValue({ members: [{ id: 'member-id' }], total: 12 });
});

it('shows the count but never loads the roster for ordinary readers', async () => {
  mocks.capabilities.mockResolvedValue({ moderation: false });
  const panel = await CommunityMembersPage({ params }) as ReactElement<{ restricted: boolean; total: number }>;
  expect(panel.props.restricted).toBe(true);
  expect(panel.props.total).toBe(12);
  expect(mocks.members).not.toHaveBeenCalled();
});

it('loads the bounded roster for staff with moderation capability', async () => {
  mocks.capabilities.mockResolvedValue({ moderation: true });
  const panel = await CommunityMembersPage({ params }) as ReactElement<{ restricted?: boolean; members: unknown[] }>;
  expect(panel.props.restricted).toBeUndefined();
  expect(panel.props.members).toHaveLength(1);
  expect(mocks.members).toHaveBeenCalledWith('community-id', { page: 1, limit: 60 });
});
