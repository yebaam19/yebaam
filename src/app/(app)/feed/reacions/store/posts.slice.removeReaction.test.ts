import { describe, it, expect, beforeEach } from 'vitest';
import { ReactionType, type Reaction } from '../interfaces/reaction.interfaces';
import { emptyCounts } from '../services/reaction.mappers';
import { decrementCountsMap } from './reaction.counts';
import { useReactionStore } from './reaction.store';

const POST_ID = 'post-debug-1';
const USER_A = 'user-a';
const USER_B = 'user-b';

function makeReaction(userId: string, id: string): Reaction {
  return {
    id,
    postId: POST_ID,
    userId,
    type: ReactionType.LIKE,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}


describe('removeReaction', () => {
  beforeEach(() => {
    useReactionStore.getState().reset();
    useReactionStore.setState({
      reactionsByPost: {
        [POST_ID]: [makeReaction(USER_A, 'r-a'), makeReaction(USER_B, 'r-b')],
      },
      countsByPost: {
        [POST_ID]: { ...emptyCounts(), LIKE: 2 },
      },
    });
  });

  it('duplicate remove for same user only decrements once (atomic set)', () => {
    const { removeReaction } = useReactionStore.getState();

    removeReaction(POST_ID, USER_A);
    removeReaction(POST_ID, USER_A);

    expect(useReactionStore.getState().countsByPost[POST_ID].LIKE).toBe(1);
    expect(useReactionStore.getState().reactionsByPost[POST_ID]).toHaveLength(1);
    expect(useReactionStore.getState().reactionsByPost[POST_ID][0].userId).toBe(USER_B);
  });

  it('simulated race (stale snapshot double-decrement) drops count too far', () => {
    const get = useReactionStore.getState;
    const set = useReactionStore.setState;

    // Simulates two handlers both reading the same reaction before either mutates state,
    // then both decrementing — the failure mode of get()-outside-set().
    const snapshot = (get().reactionsByPost[POST_ID] || []).find(r => r.userId === USER_A);
    expect(snapshot).toBeDefined();
    if (!snapshot) return;

    set(state => ({
      reactionsByPost: {
        ...state.reactionsByPost,
        [POST_ID]: (state.reactionsByPost[POST_ID] || []).filter(r => r.userId !== USER_A),
      },
      countsByPost: decrementCountsMap(state.countsByPost, POST_ID, snapshot.type),
    }));
    set(state => ({
      countsByPost: decrementCountsMap(state.countsByPost, POST_ID, snapshot.type),
    }));

    expect(useReactionStore.getState().countsByPost[POST_ID].LIKE).toBe(0);
  });
});
