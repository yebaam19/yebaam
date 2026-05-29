import { supabase } from '@/utils/supabase/client';
import { publishBroadcast } from '@/utils/supabase/realtime';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import {
  anonInvitePingTopic,
  anonUserPingTopic,
  type AcceptedAnonInvite,
  type AnonInviteBlockReason,
  type IncomingAnonInvite,
  type SendAnonInviteResult,
  type SentInviteStatus,
} from '../types';

/**
 * Thrown when the `send_anonymous_chat_invite` RPC refuses for a known business
 * reason (recipient opted out, a block exists, rate limit). Carries the
 * structured reason so the UI can show a specific message + retry time without
 * re-querying. Mirrors `FriendRequestBlockedError` in the friendships service.
 */
export class AnonInviteBlockedError extends Error {
  reason: AnonInviteBlockReason;
  retryAt?: string;

  constructor(reason: AnonInviteBlockReason, message: string, retryAt?: string) {
    super(message);
    this.name = 'AnonInviteBlockedError';
    this.reason = reason;
    this.retryAt = retryAt;
  }
}

type SendRpcResult =
  | { ok: true; invite_id: string; channel_key: string }
  | { ok: false; reason: AnonInviteBlockReason; retry_at?: string };

type RespondRpcResult =
  | { ok: true; channel_key: string; requester_nick: string; recipient_nick: string }
  | { ok: false; reason: string };

function blockMessage(reason: AnonInviteBlockReason): string {
  switch (reason) {
    case 'recipient_disabled':
      return 'Esta persona no acepta conversaciones anónimas.';
    case 'blocked':
      return 'No es posible iniciar una conversación anónima con esta persona.';
    case 'rate_limited':
      return 'Enviaste demasiadas invitaciones. Intenta de nuevo más tarde.';
    case 'invalid_recipient':
      return 'Destinatario inválido.';
    case 'unauthenticated':
      return 'Debes iniciar sesión.';
    default:
      return 'No se pudo enviar la invitación.';
  }
}

export const anonymousChatService = {
  /**
   * Ask `recipientId` to start an anonymous conversation under `nick`. The
   * server validates the recipient's setting+age, the block list and the rate
   * limit, then returns the Broadcast `channel_key` both sides will join.
   */
  async sendInvite(recipientId: string, nick: string): Promise<SendAnonInviteResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AnonInviteBlockedError('unauthenticated', blockMessage('unauthenticated'));
    }

    const { data, error } = await supabase.rpc('send_anonymous_chat_invite', {
      p_recipient: recipientId,
      p_nick: nick,
    });
    if (error) throw new Error(error.message || 'No se pudo enviar la invitación.');

    const result = data as unknown as SendRpcResult | null;
    if (!result) throw new Error('No se pudo enviar la invitación.');
    if (!result.ok) {
      throw new AnonInviteBlockedError(result.reason, blockMessage(result.reason), result.retry_at);
    }

    // Nudge the recipient to re-fetch their pending invites. Contentless — no
    // channel key, nick or identity travels over Broadcast.
    await publishBroadcast(anonUserPingTopic(recipientId), 'ping', {});

    return {
      inviteId: result.invite_id,
      channelKey: result.channel_key,
      recipientId,
      requesterNick: nick,
    };
  },

  /**
   * Recipient responds. Accept → returns the channel key + both nicks. Reject →
   * returns null (the requester learns the outcome via the invite-row UPDATE).
   */
  async respondInvite(
    inviteId: string,
    accept: boolean,
    nick?: string,
  ): Promise<AcceptedAnonInvite | null> {
    const { data, error } = await supabase.rpc('respond_anonymous_chat_invite', {
      p_invite: inviteId,
      p_accept: accept,
      p_nick: nick ?? null,
    });
    if (error) throw new Error(error.message || 'No se pudo responder la invitación.');

    const result = data as unknown as RespondRpcResult | null;

    // Notify the requester (keyed on inviteId, never on requester identity) to
    // pull the outcome. Fire for both accept and reject.
    await publishBroadcast(anonInvitePingTopic(inviteId), 'ping', {});

    // Rejection hands nothing back regardless of the RPC's success shape.
    if (!accept) return null;

    if (!result || !result.ok) {
      throw new Error('No se pudo aceptar la invitación.');
    }

    return {
      inviteId,
      channelKey: result.channel_key,
      requesterNick: result.requester_nick,
      recipientNick: result.recipient_nick,
    };
  },

  /**
   * Pulled by the REQUESTER after a response ping. SECURITY DEFINER RPC checks
   * the caller is the requester and returns the outcome (+ channel key + nicks
   * on accept). Keeps accept/reject delivery off the wire.
   */
  async getSentInviteStatus(inviteId: string): Promise<SentInviteStatus> {
    const { data, error } = await supabase.rpc('get_anon_invite_status', { p_invite: inviteId });
    if (error || !data) return { status: 'not_found' };
    const r = data as {
      status: SentInviteStatus['status'];
      channel_key?: string;
      requester_nick?: string;
      recipient_nick?: string;
    };
    return {
      status: r.status,
      channelKey: r.channel_key,
      requesterNick: r.requester_nick,
      recipientNick: r.recipient_nick,
    };
  },

  /**
   * Catch-up fetch for invites that arrived while the recipient was offline.
   * The RPC returns nick-only rows for the caller-as-recipient — the requester's
   * real identity is never included. Used on app load / window focus to seed the
   * prompt, since the live path is a private per-user broadcast.
   */
  async fetchPendingInvites(): Promise<IncomingAnonInvite[]> {
    const { data, error } = await supabase.rpc('get_pending_anon_invites');
    if (error || !data) return [];
    return (
      data as {
        invite_id: string;
        channel_key: string;
        requester_nick: string;
        created_at: string;
        expires_at: string;
      }[]
    ).map((r) => ({
      inviteId: r.invite_id,
      channelKey: r.channel_key,
      requesterNick: r.requester_nick,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
    }));
  },

  /**
   * Read the current user's anonymous-chat preference + birth date so the
   * settings UI can resolve the effective (age-aware) state. `allow === null`
   * means "no explicit choice — use the age default".
   */
  async getMySetting(): Promise<{ allow: boolean | null; birthDate: string | null }> {
    const userId = await getCurrentUserId();
    if (!userId) return { allow: null, birthDate: null };
    const { data } = await supabase
      .from('profiles')
      .select('allow_anonymous_chats, birth_date')
      .eq('id', userId)
      .maybeSingle();
    const row = data as { allow_anonymous_chats: boolean | null; birth_date: string | null } | null;
    return { allow: row?.allow_anonymous_chats ?? null, birthDate: row?.birth_date ?? null };
  },

  /** Persist the user's explicit anonymous-chat choice on their own profile row. */
  async setMySetting(allow: boolean): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('profiles')
      .update({ allow_anonymous_chats: allow })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  },

  /**
   * Delete the invite row once both sides hold the channel key + nicks in
   * memory (or when a session ends). Best-effort — a cron sweeps any leftovers.
   */
  async closeInvite(inviteId: string): Promise<void> {
    try {
      await supabase.rpc('close_anonymous_chat', { p_invite: inviteId });
    } catch {
      // best-effort: the cleanup cron is the backstop
    }
  },
};
