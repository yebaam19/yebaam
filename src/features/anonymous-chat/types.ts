/**
 * Anonymous Conversations — domain types.
 *
 * Two layers, kept strictly separate:
 *  - the **invite handshake** (persisted, transient: `anonymous_chat_invites`)
 *  - the **conversation** (ephemeral Broadcast on `anon:<channelKey>`, no DB).
 *
 * Anonymity is presentation-only: clients exchange *nicks*; the server alone
 * knows the real `auth.users` ids (for the setting/age gate, block check and
 * rate limit). The recipient's client never receives the requester's identity.
 */

/** Lifecycle of an invite — the only persisted, transient artifact. */
export type AnonInviteStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Why the server refused to send an invite. Mirrors the RPC `reason` enum so
 * the UI can show a specific message without re-querying.
 */
export type AnonInviteBlockReason =
  | 'unauthenticated'
  | 'invalid_recipient' // self / missing / unknown user
  | 'recipient_disabled' // recipient does not allow anonymous chats
  | 'blocked' // a friendships block exists in either direction
  | 'rate_limited'; // per-hour / per-day invite cap hit

/** Result of `send_anonymous_chat_invite`. */
export interface SendAnonInviteResult {
  inviteId: string;
  channelKey: string;
  recipientId: string;
  requesterNick: string;
}

/** Result of `respond_anonymous_chat_invite(accept = true)`. */
export interface AcceptedAnonInvite {
  inviteId: string;
  channelKey: string;
  requesterNick: string;
  recipientNick: string;
}

/**
 * A pending invite as seen BY THE RECIPIENT. Deliberately nick-only — the
 * requester's real identity is never sent to the recipient's client.
 */
export interface IncomingAnonInvite {
  inviteId: string;
  channelKey: string;
  requesterNick: string;
  createdAt: string;
  expiresAt: string;
}

/** An active anonymous session — held in memory only, never persisted. */
export interface AnonSession {
  inviteId: string;
  channelKey: string;
  myNick: string;
  peerNick: string;
  /** Who initiated; drives close semantics and the waiting → live transition. */
  role: 'requester' | 'recipient';
}

/**
 * A single ephemeral message. Lives only in React state for the lifetime of
 * the open session — refresh/close/disconnect erases it.
 */
export interface AnonMessage {
  /** Client-generated uuid for keys/dedupe — NOT a database id. */
  id: string;
  senderNick: string;
  /** True when this client authored it. */
  isOwn: boolean;
  content?: string;
  media?: AnonMediaPayload;
  /** epoch ms. */
  createdAt: number;
}

/**
 * Media reference broadcast over the channel (Phase 2+). Carries only a
 * Cloudflare id + an expiry — never raw bytes, never a stored DB row. The
 * receiver mints its own short-lived signed URL (images) from `cfId`.
 */
export interface AnonMediaPayload {
  kind: 'image' | 'video';
  /** Cloudflare Images id or Stream uid. */
  cfId: string;
  /** epoch ms — the client blanks the media once passed. */
  expiresAt: number;
  width?: number;
  height?: number;
}

/** Broadcast event names on the `anon:<channelKey>` channel. */
export const ANON_EVENT = {
  /** Text message. */
  msg: 'msg',
  /** Media reference (Cloudflare id + expiry). */
  media: 'media',
  /** Typing start/stop. */
  typing: 'typing',
  /** Read receipt. */
  seen: 'seen',
  /** Handshake: "I'm joined and hold both nicks + channel key." */
  ready: 'ready',
  /** Graceful close — peer is leaving; tear down on the other side. */
  bye: 'bye',
} as const;

export type AnonEventName = (typeof ANON_EVENT)[keyof typeof ANON_EVENT];

/** The broadcast channel name for a given session key. */
export function anonChannelName(channelKey: string): string {
  return `anon:${channelKey}`;
}

/**
 * Per-user "ping" topic. The requester publishes a contentless ping here after
 * sending an invite; the recipient, subscribed to their own topic, then PULLS
 * the actual invite (nick-only, channel key) via an RLS'd RPC. Sensitive data
 * never travels over Broadcast — only the nudge to re-fetch.
 */
export function anonUserPingTopic(userId: string): string {
  return `anon-invites:user:${userId}`;
}

/**
 * Per-invite "ping" topic, keyed on the inviteId (NOT the requester id, so the
 * recipient never needs the requester's identity to notify them). The recipient
 * pings here after responding; the requester pulls the outcome via an RPC.
 */
export function anonInvitePingTopic(inviteId: string): string {
  return `anon-invite:${inviteId}`;
}

/** Outcome of a sent invite, pulled by the requester after a response ping. */
export interface SentInviteStatus {
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'not_found';
  channelKey?: string;
  requesterNick?: string;
  recipientNick?: string;
}
