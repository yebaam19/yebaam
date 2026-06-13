'use client';

/**
 * Overlay shell for {@link CallProvider}: the two call surfaces rendered at the
 * app root (outside the 328px chat bubble) — the incoming-call modal while
 * `ringing`, and the full-screen active overlay for outgoing/connecting/active.
 *
 * Purely presentational: the provider owns all state + the call state machine
 * and passes the current snapshot + typed callbacks down.
 */
import type { CallPeer, CallPhase, CallSession } from '../types';
import CallIncomingModal from '../components/CallIncomingModal';
import CallActiveOverlay from '../components/CallActiveOverlay';

interface Props {
  phase: CallPhase;
  call: CallSession | null;
  peer: CallPeer | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micOn: boolean;
  camOn: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEnd: () => void;
}

export default function CallOverlays({
  phase,
  call,
  peer,
  localStream,
  remoteStream,
  micOn,
  camOn,
  onAccept,
  onDecline,
  onToggleMic,
  onToggleCam,
  onEnd,
}: Props) {
  return (
    <>
      {phase === 'incoming' && call && peer && (
        <CallIncomingModal
          peer={peer}
          callType={call.callType}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      )}
      {(phase === 'outgoing' || phase === 'connecting' || phase === 'active') && call && peer && (
        <CallActiveOverlay
          peer={peer}
          phase={phase}
          callType={call.callType}
          localStream={localStream}
          remoteStream={remoteStream}
          micOn={micOn}
          camOn={camOn}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onEnd={onEnd}
        />
      )}
    </>
  );
}
