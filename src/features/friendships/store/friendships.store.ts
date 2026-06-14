import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FriendshipsState } from './friendships.types';
import { friendshipsInitialState } from './initialState';
import { computeFriendshipStatus } from './friendships.helpers';
import { createListActions } from './slices/list.slice';
import { createRequestsActions } from './slices/requests.slice';

export const useFriendshipsStore = create<FriendshipsState>()(
  devtools(
    (set, get) => ({
      ...friendshipsInitialState,
      ...createListActions(set, get),
      ...createRequestsActions(set, get),
      getFriendshipStatus: (userId) => computeFriendshipStatus(get(), userId),
      reset: () => set(friendshipsInitialState),
    }),
    { name: 'Friendships Store' }
  )
);
