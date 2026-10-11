'use server';

import {
  listMyCommunities,
  listSuggestedCommunities,
  listPopularCommunities,
  getCommunityBySlug,
  getCommunityMembers,
  getCommunityPosts,
} from '../server/communities.server';
import type {
  Community,
  CommunityMember,
  CommunityPost,
} from '../types/community.types';

function boundedInteger(value: number, max: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new RangeError(`El valor debe estar entre 1 y ${max}.`);
  }
  return value;
}

/**
 * Read wrappers — thin `'use server'` entry points over the cached server reads
 * in `../server/communities.server`, called by client hooks via the service
 * layer.
 */

export async function getMyCommunitiesAction(): Promise<Community[]> {
  return listMyCommunities();
}

export async function getSuggestedCommunitiesAction(limit = 12): Promise<Community[]> {
  return listSuggestedCommunities(boundedInteger(limit, 50));
}

export async function getPopularCommunitiesAction(limit = 12): Promise<Community[]> {
  return listPopularCommunities(boundedInteger(limit, 50));
}

export async function getCommunityBySlugAction(slug: string): Promise<Community | null> {
  return getCommunityBySlug(slug);
}

export async function getCommunityPostsAction(
  communityId: string,
  page = 1,
  limit = 10,
): Promise<{ posts: CommunityPost[]; total: number }> {
  return getCommunityPosts(communityId, {
    page: boundedInteger(page, 1000), limit: boundedInteger(limit, 50),
  });
}

export async function getCommunityMembersAction(
  communityId: string,
  page = 1,
  limit = 20,
): Promise<{ members: CommunityMember[]; total: number }> {
  return getCommunityMembers(communityId, {
    page: boundedInteger(page, 1000), limit: boundedInteger(limit, 60),
  });
}
