/**
 * Thin client for the call REST surface. Mirrors `chat.service` — plain
 * `fetch` to the App Router route handlers (never axios, never a direct
 * Supabase call), same-origin credentials so the session cookie rides along.
 */
import type { CallAction, CallSession, CallType } from './types';

interface ApiBody {
  success?: boolean;
  data?: unknown;
  error?: unknown;
}

async function readJson(res: Response): Promise<ApiBody> {
  return (await res.json().catch(() => ({}))) as ApiBody;
}

function unwrap(body: ApiBody, fallback: string): CallSession {
  if (!body?.success || !body?.data) {
    throw new Error(typeof body?.error === 'string' ? body.error : fallback);
  }
  return body.data as CallSession;
}

export const callService = {
  /** Start a 1:1 call. Inserts a `ringing` row; the callee gets it via Realtime. */
  async startCall(conversationId: string, calleeId: string, callType: CallType): Promise<CallSession> {
    const res = await fetch(`/api/conversations/${conversationId}/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ calleeId, callType }),
    });
    const body = await readJson(res);
    if (res.status === 409) {
      // Surface "busy / already in a call" distinctly so the UI can localize it.
      throw new Error(typeof body?.error === 'string' ? body.error : 'busy');
    }
    if (!res.ok) throw new Error(typeof body?.error === 'string' ? body.error : 'startFailed');
    return unwrap(body, 'startFailed');
  },

  /** Accept / decline / end an existing call. */
  async updateCall(
    conversationId: string,
    callId: string,
    action: CallAction,
    reason?: string,
  ): Promise<CallSession> {
    const res = await fetch(`/api/conversations/${conversationId}/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action, reason }),
    });
    const body = await readJson(res);
    if (!res.ok) throw new Error(typeof body?.error === 'string' ? body.error : 'updateFailed');
    return unwrap(body, 'updateFailed');
  },

  /** The conversation's current ringing/active call, if any (used on open). */
  async getActiveCall(conversationId: string): Promise<CallSession | null> {
    const res = await fetch(`/api/conversations/${conversationId}/calls/active`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const body = await readJson(res);
    return (body?.data as CallSession | null) ?? null;
  },

  /** Short-lived ICE servers (Cloudflare TURN + STUN, or STUN-only fallback). */
  async getIceServers(): Promise<RTCIceServer[]> {
    try {
      const res = await fetch('/api/calls/ice', { credentials: 'same-origin' });
      if (!res.ok) return FALLBACK_ICE_SERVERS;
      const body = (await res.json().catch(() => ({}))) as { iceServers?: RTCIceServer[] };
      const servers = body.iceServers;
      return Array.isArray(servers) && servers.length > 0 ? servers : FALLBACK_ICE_SERVERS;
    } catch {
      return FALLBACK_ICE_SERVERS;
    }
  },
};

/** Public STUN only — used if the ICE route is unreachable. Works on most NATs. */
export const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] },
];
