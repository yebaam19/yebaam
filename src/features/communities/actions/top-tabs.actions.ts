'use server';

import { z } from 'zod';
import { runPlanAction, planWriteError } from './plans/_shared';
import { COMMUNITY_TAB_KEYS, type CommunityTopTab } from '../types/communityTopTab.types';

const inputSchema = z.object({
  communityId: z.uuid(),
  tabs: z.array(z.object({
    tab_key: z.enum(COMMUNITY_TAB_KEYS),
    title: z.string().trim().min(1).max(40),
    position: z.number().int().min(0).max(5),
    is_visible: z.boolean(),
    expected_version: z.number().int().min(0).max(2147483646),
  })).length(6).refine((tabs) =>
    new Set(tabs.map((tab) => tab.tab_key)).size === 6 &&
    new Set(tabs.map((tab) => tab.position)).size === 6,
  ),
});

export async function saveCommunityTopTabs(input: unknown) {
  return runPlanAction(inputSchema, input, 'settings', async ({ client }, value) => {
    const { data, error } = await client.rpc('save_community_top_tabs', {
      target_community: value.communityId, desired: value.tabs,
    });
    if (error) return { ok: false, error: planWriteError(error.code) };
    return { ok: true, data: data as CommunityTopTab[] };
  });
}
