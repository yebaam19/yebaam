/**
 * Client-side companion to the server's at-rest chat encryption.
 *
 * Private messages are stored AES-256-GCM-encrypted, so the raw rows that
 * Supabase Realtime hands to `postgres_changes` subscribers carry ciphertext
 * in `content`. Subscribers detect it with `isEncryptedContent()` and resolve
 * the plaintext with `fetchDecryptedContent()`, which round-trips through the
 * participant-authenticated single-message endpoint (the only place the key
 * is applied). Legacy plaintext rows skip the fetch entirely.
 */

const ENC_PREFIX = 'enc:v1:';

export function isEncryptedContent(content: unknown): content is string {
  return typeof content === 'string' && content.startsWith(ENC_PREFIX);
}

// Module-scoped in-flight guard: the full page, floating bubble, and global
// inbox can all subscribe to the same conversation — one fetch per message
// serves every surface.
const inFlight = new Map<string, Promise<string | null>>();

export function fetchDecryptedContent(
  conversationId: string,
  messageId: string,
): Promise<string | null> {
  const key = `${conversationId}:${messageId}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}`,
        { credentials: 'same-origin' },
      );
      if (!response.ok) return null;
      const payload = (await response.json().catch(() => null)) as {
        data?: { content?: string };
      } | null;
      return typeof payload?.data?.content === 'string' ? payload.data.content : null;
    } catch {
      return null;
    } finally {
      // Let the next realtime event for this message (e.g. an edit after an
      // insert) fetch fresh content instead of reusing this settled promise.
      queueMicrotask(() => inFlight.delete(key));
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
