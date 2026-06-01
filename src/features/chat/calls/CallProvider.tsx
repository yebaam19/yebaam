'use client';

/**
 * Global 1:1 call orchestrator. Mounted once at the app shell so it can both
 * ring the user from anywhere (incoming) and host the full-screen call overlay
 * outside the 328px chat bubble.
 *
 * Truth model: the `call_sessions` row drives lifecycle (ringing/active/…) over
 * Realtime postgres_changes; the {@link CallEngine} owns media + the WebRTC
 * SDP/ICE handshake over an ephemeral broadcast channel. This component is the
 * state machine that wires the two together and renders the UI.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { loadConversationDisplay } from '@/features/chat/lib/conversationDisplay';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { callService } from './call.service';
import { CallEngine } from './call-engine';
import {
  mapCallRow,
  type CallPeer,
  type CallPhase,
  type CallSession,
  type CallType,
  type DbCallSessionRow,
} from './types';
import CallIncomingModal from './components/CallIncomingModal';
import CallActiveOverlay from './components/CallActiveOverlay';

const RING_TIMEOUT_MS = 30_000;

interface StartCallArgs {
  conversationId: string;
  peer: CallPeer;
  callType: CallType;
}

interface CallContextValue {
  phase: CallPhase;
  isBusy: boolean;
  startCall: (args: StartCallArgs) => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCalls(): CallContextValue {
  return useContext(CallContext) ?? { phase: 'idle', isBusy: false, startCall: () => {} };
}

export function CallProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('chat.call');
  const myId = useAuthStore((s) => s.user?.id) ?? null;

  const [phase, setPhase] = useState<CallPhase>('idle');
  const [call, setCall] = useState<CallSession | null>(null);
  const [peer, setPeer] = useState<CallPeer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Refs mirror state for use inside long-lived subscription callbacks.
  const phaseRef = useRef<CallPhase>('idle');
  const callRef = useRef<CallSession | null>(null);
  const peerRef = useRef<CallPeer | null>(null);
  const engineRef = useRef<CallEngine | null>(null);
  const lifecycleRef = useRef<ReturnType<typeof subscribeToTable> | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPhaseBoth = (p: CallPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const setCallBoth = (c: CallSession | null) => {
    callRef.current = c;
    setCall(c);
  };
  const setPeerBoth = (p: CallPeer | null) => {
    peerRef.current = p;
    setPeer(p);
  };

  const resetState = () => {
    if (lifecycleRef.current) unsubscribe(lifecycleRef.current);
    lifecycleRef.current = null;
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    ringTimerRef.current = null;
    engineRef.current = null;
    setCallBoth(null);
    setPeerBoth(null);
    setPhaseBoth('idle');
    setLocalStream(null);
    setRemoteStream(null);
    setMicOn(true);
    setCamOn(true);
  };

  /** We end/cancel the call: notify the peer, mark the row ended, tear down. */
  const end = async () => {
    const c = callRef.current;
    const engine = engineRef.current;
    if (engine) await engine.close(true);
    if (c) callService.updateCall(c.conversationId, c.id, 'end').catch(() => {});
    resetState();
  };

  /** Peer/connection ended it: stop media (no bye), toast, tear down. */
  const peerEnded = async (toastKey: 'ended' | 'declined' | 'noAnswer' | null) => {
    const engine = engineRef.current;
    if (engine) await engine.close(false);
    if (toastKey) toast(t(toastKey));
    resetState();
  };

  const subscribeLifecycle = (callId: string) => {
    if (lifecycleRef.current) unsubscribe(lifecycleRef.current);
    lifecycleRef.current = subscribeToTable<DbCallSessionRow>({
      channel: `calls:lifecycle:${callId}`,
      table: 'call_sessions',
      filter: `id=eq.${callId}`,
      events: ['UPDATE'],
      onChange: (p) => onLifecycle(p.new as DbCallSessionRow),
    });
  };

  const onLifecycle = (row: DbCallSessionRow) => {
    const c = callRef.current;
    if (!c || !row?.id || row.id !== c.id) return;
    if (row.status === 'active') {
      setCallBoth(mapCallRow(row));
      if (phaseRef.current === 'outgoing') {
        if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
        setPhaseBoth('connecting');
      }
    } else if (row.status === 'declined') {
      void peerEnded('declined');
    } else if (row.status === 'ended' || row.status === 'missed') {
      void peerEnded(row.status === 'missed' ? 'noAnswer' : 'ended');
    }
  };

  const startEngine = async (session: CallSession, role: 'caller' | 'callee') => {
    try {
      const iceServers = await callService.getIceServers();
      const engine = new CallEngine({
        callId: session.id,
        selfId: myId as string,
        role,
        callType: session.callType,
        iceServers,
        onLocalStream: setLocalStream,
        onRemoteStream: setRemoteStream,
        onStateChange: (state) => {
          if (state === 'connected') setPhaseBoth('active');
          else if (state === 'failed') void end();
          else if (state === 'closed') void peerEnded('ended');
        },
        onError: (kind) => {
          if (kind === 'media') toast.error(t('mediaDenied'));
          else if (kind === 'unsupported') toast.error(t('unsupported'));
          if (kind !== 'connection') void end();
        },
      });
      engineRef.current = engine;
      await engine.start();
    } catch {
      // onError already surfaced + ended; ensure teardown if not already.
      if (callRef.current) await end();
    }
  };

  const startCall = async ({ conversationId, peer: target, callType }: StartCallArgs) => {
    if (!myId) return;
    if (phaseRef.current !== 'idle') {
      toast.error(t('alreadyInCall'));
      return;
    }
    if (!CallEngine.isSupported()) {
      toast.error(t('unsupported'));
      return;
    }
    let session: CallSession;
    try {
      session = await callService.startCall(conversationId, target.id, callType);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(msg === 'busy' ? t('busy', { name: target.name }) : t('startFailed'));
      return;
    }
    setCallBoth(session);
    setPeerBoth(target);
    setMicOn(true);
    setCamOn(callType === 'video');
    setPhaseBoth('outgoing');
    subscribeLifecycle(session.id);
    ringTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'outgoing') {
        const c = callRef.current;
        if (c) callService.updateCall(c.conversationId, c.id, 'end', 'timeout').catch(() => {});
        void peerEnded('noAnswer');
      }
    }, RING_TIMEOUT_MS);
    await startEngine(session, 'caller');
  };

  const accept = async () => {
    const c = callRef.current;
    if (!c || phaseRef.current !== 'incoming') return;
    try {
      const updated = await callService.updateCall(c.conversationId, c.id, 'accept');
      setCallBoth(updated);
    } catch {
      toast.error(t('startFailed'));
      void peerEnded(null);
      return;
    }
    setPhaseBoth('connecting');
    await startEngine(c, 'callee');
  };

  const decline = async () => {
    const c = callRef.current;
    if (c) callService.updateCall(c.conversationId, c.id, 'decline').catch(() => {});
    await peerEnded(null);
  };

  // Incoming-call listener: any `ringing` row addressed to me.
  useEffect(() => {
    if (!myId) return;
    const channel = subscribeToTable<DbCallSessionRow>({
      channel: `calls:incoming:${myId}`,
      table: 'call_sessions',
      filter: `callee_id=eq.${myId}`,
      events: ['INSERT'],
      onChange: (p) => void onIncoming(p.new as DbCallSessionRow),
    });
    return () => {
      unsubscribe(channel);
      void engineRef.current?.close(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  const onIncoming = async (row: DbCallSessionRow) => {
    if (!row?.id || row.status !== 'ringing') return;
    if (row.callee_id !== myId || row.caller_id === myId) return;
    if (phaseRef.current !== 'idle') {
      callService.updateCall(row.conversation_id, row.id, 'decline', 'busy').catch(() => {});
      return;
    }
    const session = mapCallRow(row);
    setCallBoth(session);
    setPeerBoth({ id: session.callerId, name: t('incomingVideoCall'), avatar: '' });
    setMicOn(true);
    setCamOn(session.callType === 'video');
    setPhaseBoth('incoming');
    subscribeLifecycle(session.id);
    try {
      const d = await loadConversationDisplay(session.conversationId, myId as string, null);
      if (callRef.current?.id === session.id) {
        setPeerBoth({ id: session.callerId, name: d.name, avatar: d.avatar });
      }
    } catch {
      /* keep fallback label */
    }
  };

  const toggleMic = () => {
    setMicOn((prev) => {
      const next = !prev;
      engineRef.current?.setAudioEnabled(next);
      return next;
    });
  };
  const toggleCam = () => {
    setCamOn((prev) => {
      const next = !prev;
      engineRef.current?.setVideoEnabled(next);
      return next;
    });
  };

  const value: CallContextValue = { phase, isBusy: phase !== 'idle', startCall };

  return (
    <CallContext.Provider value={value}>
      {children}
      {phase === 'incoming' && call && peer && (
        <CallIncomingModal
          peer={peer}
          callType={call.callType}
          onAccept={accept}
          onDecline={decline}
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
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
          onEnd={end}
        />
      )}
    </CallContext.Provider>
  );
}
