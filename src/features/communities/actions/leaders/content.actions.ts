'use server';

import { leaderCategorySchema, leaderInputSchema, leaderDeleteSchema } from '../../schemas/communityLeader.schema';
import { sanitizePlanContent } from '../../server/plan-content';
import { runPlanAction } from '../plans/_shared';
import { saveDirectoryRecord, deleteDirectoryRecord } from './_shared';

export async function saveLeaderCategory(input: unknown) {
  return runPlanAction(leaderCategorySchema, input, 'content', ({ client }, value) =>
    saveDirectoryRecord(client, 'community_leader_categories', value, {
      section_id: value.sectionId, title: value.title, position: value.position, is_published: value.isPublished,
    }));
}
export async function saveCommunityLeader(input: unknown) {
  return runPlanAction(leaderInputSchema, input, 'content', ({ client }, value) =>
    saveDirectoryRecord(client, 'community_leaders', value, {
      section_id: value.sectionId, category_id: value.categoryId, full_name: value.fullName,
      responsibility: value.responsibility, biography: sanitizePlanContent(value.biography),
      trajectory: sanitizePlanContent(value.trajectory), position: value.position, is_published: value.isPublished,
    }));
}
export async function deleteLeaderCategory(input: unknown) {
  return runPlanAction(leaderDeleteSchema, input, 'content', ({ client }, value) =>
    deleteDirectoryRecord(client, 'community_leader_categories', value));
}
export async function deleteCommunityLeader(input: unknown) {
  return runPlanAction(leaderDeleteSchema, input, 'content', ({ client }, value) =>
    deleteDirectoryRecord(client, 'community_leaders', value));
}
