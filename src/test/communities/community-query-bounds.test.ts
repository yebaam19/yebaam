import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCommunityMembersAction,
  getCommunityPostsAction,
  getPopularCommunitiesAction,
  getSuggestedCommunitiesAction,
} from '@/features/communities/actions/queries.actions';

const mocks = vi.hoisted(() => ({
  members: vi.fn(), posts: vi.fn(), popular: vi.fn(), suggested: vi.fn(),
}));
vi.mock('@/features/communities/server/communities.server', () => ({
  getCommunityMembers: mocks.members,
  getCommunityPosts: mocks.posts,
  listPopularCommunities: mocks.popular,
  listSuggestedCommunities: mocks.suggested,
}));

beforeEach(() => vi.resetAllMocks());

describe('community read action bounds', () => {
  it('preserves ordinary pagination and rejects excessive reads', async () => {
    await getCommunityPostsAction('community-id', 2, 10);
    await getCommunityMembersAction('community-id', 1, 60);
    expect(mocks.posts).toHaveBeenCalledWith('community-id', { page: 2, limit: 10 });
    expect(mocks.members).toHaveBeenCalledWith('community-id', { page: 1, limit: 60 });

    await expect(getCommunityPostsAction('community-id', 1, 100_000)).rejects.toBeInstanceOf(RangeError);
    await expect(getCommunityMembersAction('community-id', 100_000, 20)).rejects.toBeInstanceOf(RangeError);
    await expect(getCommunityPostsAction('community-id', Number.NaN, 10)).rejects.toBeInstanceOf(RangeError);
    expect(mocks.posts).toHaveBeenCalledTimes(1);
    expect(mocks.members).toHaveBeenCalledTimes(1);
  });

  it('bounds popular and suggested list requests', async () => {
    await getPopularCommunitiesAction(12);
    await getSuggestedCommunitiesAction(6);
    await expect(getPopularCommunitiesAction(10_000)).rejects.toBeInstanceOf(RangeError);
    await expect(getSuggestedCommunitiesAction(0)).rejects.toBeInstanceOf(RangeError);
    expect(mocks.popular).toHaveBeenCalledExactlyOnceWith(12);
    expect(mocks.suggested).toHaveBeenCalledExactlyOnceWith(6);
  });
});
