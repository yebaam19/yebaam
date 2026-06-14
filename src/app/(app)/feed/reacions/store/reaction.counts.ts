import type { ReactionCounts, ReactionType } from '../interfaces/reaction.interfaces';
import { emptyCounts } from '../services/reaction.mappers';

export function bumpCount(
  map: Record<string, ReactionCounts>,
  id: string,
  add: ReactionType | null,
  remove: ReactionType | null,
): Record<string, ReactionCounts> {
  const current = map[id] ?? emptyCounts();
  const next: ReactionCounts = { ...current };
  if (remove) next[remove] = Math.max(0, next[remove] - 1);
  if (add) next[add] = next[add] + 1;
  return { ...map, [id]: next };
}

export function incrementCountsMap(
  map: Record<string, ReactionCounts>,
  postId: string,
  type: ReactionType,
): Record<string, ReactionCounts> {
  const counts = map[postId] || emptyCounts();

  return {
    ...map,
    [postId]: {
      ...counts,
      [type]: counts[type] + 1,
    },
  };
}

export function decrementCountsMap(
  map: Record<string, ReactionCounts>,
  postId: string,
  type: ReactionType,
): Record<string, ReactionCounts> {
  const counts = map[postId] || emptyCounts();

  return {
    ...map,
    [postId]: {
      ...counts,
      [type]: Math.max(0, counts[type] - 1),
    },
  };
}
