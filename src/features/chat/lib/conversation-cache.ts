/**
 * In-memory, session-scoped caches that make reopening a chat feel instant
 * (Messenger-style stale-while-revalidate). Reopening a bubble renders the last
 * known messages immediately — no "Cargando mensajes…" spinner — while the hook
 * revalidates in the background. Cleared on a full page reload, which is fine:
 * the first open after reload pays the network cost once, then it's warm.
 *
 *  - `convIdByContact`: peer userId → conversationId. Lets us skip the 1–2
 *    resolve round-trips on open. Primed from the loaded conversation list.
 *  - `messagesByConv`:  conversationId → last rendered message list. Lets us
 *    paint the thread instantly on reopen.
 */
type CachedMessage = { id: string } & Record<string, unknown>;

const convIdByContact = new Map<string, string>();
const messagesByConv = new Map<string, CachedMessage[]>();

/** Bound memory: keep the most-recently-touched N threads' message snapshots. */
const MAX_CACHED_THREADS = 50;

export const conversationCache = {
  getConvId(contactId: string): string | null {
    return convIdByContact.get(contactId) ?? null;
  },
  setConvId(contactId: string, conversationId: string): void {
    if (contactId && conversationId) convIdByContact.set(contactId, conversationId);
  },

  getMessages(conversationId: string): CachedMessage[] | null {
    return messagesByConv.get(conversationId) ?? null;
  },
  setMessages(conversationId: string, messages: CachedMessage[]): void {
    if (!conversationId) return;
    // LRU-ish eviction: re-inserting moves the key to the most-recent position.
    if (messagesByConv.has(conversationId)) {
      messagesByConv.delete(conversationId);
    } else if (messagesByConv.size >= MAX_CACHED_THREADS) {
      const oldest = messagesByConv.keys().next().value;
      if (oldest) messagesByConv.delete(oldest);
    }
    messagesByConv.set(conversationId, messages);
  },
};
