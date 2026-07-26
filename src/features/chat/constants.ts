/**
 * Chat limits shared by the browser and the route handlers.
 *
 * Client-safe (no server-only imports) so the composer and the API enforce one
 * number, the same discipline as `@/lib/upload-limits`.
 */

/**
 * Maximum characters in a single message body.
 *
 * A cap has to exist because the recipient cannot delete another user's message
 * — DELETE is scoped to `sender_id = me` — so an oversized body is permanent for
 * them: every thread page re-reads it (up to 200 rows per request), the
 * conversation list ships it verbatim as the inbox preview, and the encryption
 * path buffers it. One write therefore multiplies into unbounded server
 * allocation on every subsequent read, for the victim only.
 *
 * 8000 is comfortably above any real message (a long paragraph is ~1500) and far
 * below the platform body limit that was previously the only bound.
 */
export const MAX_MESSAGE_CHARS = 8_000;

/** Characters of a message body kept for the conversation-list preview. */
export const INBOX_PREVIEW_CHARS = 200;
