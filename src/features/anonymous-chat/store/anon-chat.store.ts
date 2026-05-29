import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AnonSession, IncomingAnonInvite } from '../types';

/**
 * In-memory state for anonymous conversations. Deliberately separate from
 * `chat.store.ts` so anonymous sessions never leak into the persisted
 * conversation list, the unread counts, or the normal bubble tray.
 *
 * Nothing here is persisted across reloads — that is the whole point.
 */
interface AnonChatState {
  /** Active sessions rendered as anonymous bubbles / full-page views. */
  sessions: AnonSession[];
  openSession: (session: AnonSession) => void;
  closeSession: (channelKey: string) => void;
  getSession: (channelKey: string) => AnonSession | undefined;

  /**
   * The single incoming invite the recipient must accept/reject. One at a time
   * keeps the prompt unambiguous; a newer invite supersedes an unanswered one.
   */
  incomingInvite: IncomingAnonInvite | null;
  setIncomingInvite: (invite: IncomingAnonInvite | null) => void;
}

const MAX_OPEN_ANON = 3;

export const useAnonChatStore = create<AnonChatState>()(
  devtools(
    (set, get) => ({
      sessions: [],
      openSession: (session) =>
        set((state) => {
          if (state.sessions.some((s) => s.channelKey === session.channelKey)) {
            return state;
          }
          const next =
            state.sessions.length >= MAX_OPEN_ANON
              ? [...state.sessions.slice(1), session]
              : [...state.sessions, session];
          return { sessions: next };
        }),
      closeSession: (channelKey) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.channelKey !== channelKey),
        })),
      getSession: (channelKey) => get().sessions.find((s) => s.channelKey === channelKey),

      incomingInvite: null,
      setIncomingInvite: (invite) => set({ incomingInvite: invite }),
    }),
    { name: 'AnonChatStore' },
  ),
);
