/**
 * Shared types for 1:1 calls (video + voice).
 *
 * Lifecycle truth lives in the `call_sessions` table (durable). WebRTC
 * negotiation (SDP + ICE) rides ephemeral Realtime Broadcast — see
 * call-engine.ts. These types are the contract between the API routes,
 * the client service, the CallProvider and the engine.
 */

export type CallType = 'video' | 'audio';

export type CallStatus = 'ringing' | 'active' | 'declined' | 'ended' | 'missed';

/** Action a participant takes on an existing call (PATCH body). */
export type CallAction = 'accept' | 'decline' | 'end';

/** Camel-cased call session as returned by the API + used across the UI. */
export interface CallSession {
  id: string;
  conversationId: string;
  callerId: string;
  calleeId: string;
  callType: CallType;
  status: CallStatus;
  createdAt: string;
  acceptedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
}

/** Raw snake_cased row as it arrives over Realtime postgres_changes. */
export interface DbCallSessionRow {
  id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  call_type: CallType;
  status: CallStatus;
  created_at: string;
  accepted_at: string | null;
  ended_at: string | null;
  end_reason: string | null;
  updated_at?: string;
}

export function mapCallRow(row: DbCallSessionRow): CallSession {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    callerId: row.caller_id,
    calleeId: row.callee_id,
    callType: row.call_type,
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at ?? null,
    endedAt: row.ended_at ?? null,
    endReason: row.end_reason ?? null,
  };
}

/** Which side of the call we are. Decides who creates the SDP offer. */
export type CallRole = 'caller' | 'callee';

/** The other person on the call, for header/incoming/overlay display. */
export interface CallPeer {
  id: string;
  name: string;
  avatar: string;
}

/**
 * Ephemeral WebRTC signals exchanged over the broadcast channel `call:<id>`.
 * Broadcast has no replay, so the caller waits for the callee's `ready` before
 * sending the offer (the callee only joins the channel once it accepts).
 */
export type CallSignal =
  | { kind: 'ready'; from: string }
  | { kind: 'offer'; from: string; sdp: RTCSessionDescriptionInit }
  | { kind: 'answer'; from: string; sdp: RTCSessionDescriptionInit }
  | { kind: 'ice'; from: string; candidate: RTCIceCandidateInit }
  | { kind: 'bye'; from: string };

/** Broadcast event name carrying a {@link CallSignal}. */
export const CALL_SIGNAL_EVENT = 'signal';

/** Channel name for a call's ephemeral signaling. */
export function callSignalChannel(callId: string): string {
  return `call:${callId}`;
}

/** UI-facing phase of the local call experience. */
export type CallPhase =
  | 'idle'
  | 'outgoing' // we started it, waiting for the peer to pick up
  | 'incoming' // peer started it, we're being rung
  | 'connecting' // accepted, negotiating media
  | 'active' // media flowing
  | 'ended';
