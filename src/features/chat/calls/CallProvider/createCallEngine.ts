/**
 * Media-state wiring for {@link CallProvider}: builds the {@link CallEngine}
 * (getUserMedia + the WebRTC SDP/ICE handshake) for one call session and
 * threads its stream + connection-state callbacks back into the provider's
 * state machine.
 *
 * This is the "media" half of the call; the durable `call_sessions` lifecycle
 * is handled separately (see createLifecycleSubscription). Kept as a plain
 * factory so the provider stays the single owner of state + teardown ordering.
 */
import { CallEngine } from '../call-engine';
import type { CallPhase, CallSession } from '../types';

interface CreateCallEngineDeps {
  /** Current user id; the engine's `selfId`. */
  myId: string;
  /** Short-lived ICE servers (Cloudflare TURN + STUN, or STUN-only fallback). */
  iceServers: RTCIceServer[];
  /** Stream sinks — wired straight to the provider's React state setters. */
  onLocalStream: (stream: MediaStream | null) => void;
  onRemoteStream: (stream: MediaStream | null) => void;
  /** Drive the UI phase from the underlying connection state. */
  setPhase: (phase: CallPhase) => void;
  /** We end/cancel: notify peer, mark row ended, tear down. */
  end: () => Promise<void>;
  /** Peer/connection ended it: stop media (no bye), optional toast, tear down. */
  peerEnded: (toastKey: 'ended' | 'declined' | 'noAnswer' | null) => Promise<void>;
  /** Localized media-permission error toast. */
  onMediaDenied: () => void;
  /** Localized unsupported-browser error toast. */
  onUnsupported: () => void;
}

/**
 * Construct (but do not yet start) the {@link CallEngine} for `session`.
 * Caller assigns the returned engine to its ref, then `await engine.start()`.
 */
export function createCallEngine(
  session: CallSession,
  role: 'caller' | 'callee',
  deps: CreateCallEngineDeps,
): CallEngine {
  const {
    myId,
    iceServers,
    onLocalStream,
    onRemoteStream,
    setPhase,
    end,
    peerEnded,
    onMediaDenied,
    onUnsupported,
  } = deps;
  return new CallEngine({
    callId: session.id,
    selfId: myId,
    role,
    callType: session.callType,
    iceServers,
    onLocalStream,
    onRemoteStream,
    onStateChange: (state) => {
      if (state === 'connected') setPhase('active');
      else if (state === 'failed') void end();
      else if (state === 'closed') void peerEnded('ended');
    },
    onError: (kind) => {
      if (kind === 'media') onMediaDenied();
      else if (kind === 'unsupported') onUnsupported();
      if (kind !== 'connection') void end();
    },
  });
}
