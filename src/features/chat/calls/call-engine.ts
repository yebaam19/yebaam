/**
 * Framework-agnostic WebRTC engine for a single 1:1 call.
 *
 * Roles are fixed (no glare): the CALLER creates the SDP offer, the CALLEE
 * answers. Broadcast has no replay, so the callee announces `ready` only after
 * it has joined the `call:<id>` channel; the caller then sends the offer. ICE
 * candidates are trickled and buffered until the remote description is set.
 *
 * Lifecycle truth still lives in `call_sessions` (the provider drives that);
 * this class only owns media + the peer connection + ephemeral signaling.
 */
import { openBroadcastChannel, type BroadcastChannelHandle } from '@/utils/supabase/realtime';
import {
  CALL_SIGNAL_EVENT,
  callSignalChannel,
  type CallRole,
  type CallSignal,
  type CallType,
} from './types';

export type CallErrorKind = 'media' | 'connection' | 'unsupported';

export interface CallEngineOptions {
  callId: string;
  selfId: string;
  role: CallRole;
  callType: CallType;
  iceServers: RTCIceServer[];
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onStateChange: (state: RTCPeerConnectionState) => void;
  onError: (kind: CallErrorKind, err?: unknown) => void;
}

export class CallEngine {
  private pc: RTCPeerConnection | null = null;
  private local: MediaStream | null = null;
  private readonly remote = new MediaStream();
  private chan: BroadcastChannelHandle | null = null;
  private readonly pendingIce: RTCIceCandidateInit[] = [];
  private remoteSet = false;
  private offerSent = false;
  private closed = false;
  private readyTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly opts: CallEngineOptions) {}

  static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof RTCPeerConnection !== 'undefined'
    );
  }

  async start(): Promise<void> {
    if (!CallEngine.isSupported()) {
      this.opts.onError('unsupported');
      throw new Error('unsupported');
    }

    // 1. Acquire local media (camera optional for voice calls).
    try {
      this.local = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video:
          this.opts.callType === 'video'
            ? { width: { ideal: 1280 }, height: { ideal: 720 } }
            : false,
      });
    } catch (err) {
      this.opts.onError('media', err);
      throw err;
    }
    if (this.closed) {
      this.stopLocal();
      return;
    }
    this.opts.onLocalStream(this.local);

    // 2. Peer connection.
    const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers });
    this.pc = pc;
    for (const track of this.local.getTracks()) pc.addTrack(track, this.local);

    pc.ontrack = (e) => {
      const tracks = e.streams[0]?.getTracks() ?? [e.track];
      for (const t of tracks) {
        if (!this.remote.getTracks().includes(t)) this.remote.addTrack(t);
      }
      this.opts.onRemoteStream(this.remote);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        void this.signal({ kind: 'ice', from: this.opts.selfId, candidate: e.candidate.toJSON() });
      }
    };
    pc.onconnectionstatechange = () => {
      this.opts.onStateChange(pc.connectionState);
      if (pc.connectionState === 'failed') this.opts.onError('connection');
    };

    // 3. Signaling channel (one channel, both directions).
    this.chan = openBroadcastChannel(
      callSignalChannel(this.opts.callId),
      (_event, payload) => void this.onSignal(payload as CallSignal),
      [CALL_SIGNAL_EVENT],
    );
    await this.chan.ready;
    if (this.closed) return;

    // 4. Handshake: the callee announces `ready`; the caller offers on hearing
    //    it. Broadcast has no replay, so if the caller hasn't joined the channel
    //    yet (e.g. still sitting on its getUserMedia permission prompt) the
    //    first `ready` is lost and the call would hang in "connecting" forever.
    //    The callee therefore re-announces until the offer lands (or it gives up).
    if (this.opts.role === 'callee') this.announceReady();
  }

  /** Callee only: re-emit `ready` until the caller's offer arrives, capped. */
  private announceReady(): void {
    let attempts = 0;
    const MAX_ATTEMPTS = 6; // ~9s of coverage at 1.5s spacing
    const ping = () => {
      if (this.closed || this.remoteSet) {
        this.clearReadyTimer();
        return;
      }
      void this.signal({ kind: 'ready', from: this.opts.selfId });
      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) this.clearReadyTimer();
    };
    ping(); // fire immediately, then retry on the interval
    this.readyTimer = setInterval(ping, 1500);
  }

  private clearReadyTimer(): void {
    if (this.readyTimer) {
      clearInterval(this.readyTimer);
      this.readyTimer = null;
    }
  }

  private async signal(sig: CallSignal): Promise<void> {
    if (!this.chan || this.closed) return;
    try {
      await this.chan.send(CALL_SIGNAL_EVENT, sig as unknown as Record<string, unknown>);
    } catch (err) {
      console.warn('[CallEngine] signal send failed', err);
    }
  }

  private async onSignal(sig: CallSignal): Promise<void> {
    const pc = this.pc;
    if (!pc || this.closed || sig.from === this.opts.selfId) return;
    try {
      if (sig.kind === 'ready' && this.opts.role === 'caller' && !this.offerSent) {
        this.offerSent = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await this.signal({ kind: 'offer', from: this.opts.selfId, sdp: offer });
      } else if (sig.kind === 'offer' && this.opts.role === 'callee') {
        this.clearReadyTimer(); // offer landed — stop re-announcing
        await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
        this.remoteSet = true;
        await this.flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await this.signal({ kind: 'answer', from: this.opts.selfId, sdp: answer });
      } else if (sig.kind === 'answer' && this.opts.role === 'caller') {
        await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
        this.remoteSet = true;
        await this.flushIce();
      } else if (sig.kind === 'ice') {
        if (this.remoteSet) {
          await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
        } else {
          this.pendingIce.push(sig.candidate);
        }
      } else if (sig.kind === 'bye') {
        this.opts.onStateChange('closed');
      }
    } catch (err) {
      console.warn('[CallEngine] onSignal error', err);
    }
  }

  private async flushIce(): Promise<void> {
    if (!this.pc) return;
    const queued = this.pendingIce.splice(0);
    for (const c of queued) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        // a late/duplicate candidate is non-fatal
      }
    }
  }

  setAudioEnabled(enabled: boolean): void {
    this.local?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  setVideoEnabled(enabled: boolean): void {
    this.local?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  private stopLocal(): void {
    this.local?.getTracks().forEach((t) => t.stop());
    this.local = null;
  }

  async close(sendBye = true): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.clearReadyTimer();
    if (sendBye) await this.signal({ kind: 'bye', from: this.opts.selfId });
    try {
      this.pc?.getSenders().forEach((s) => s.track?.stop());
    } catch {
      // ignore
    }
    this.stopLocal();
    try {
      this.pc?.close();
    } catch {
      // ignore
    }
    this.pc = null;
    this.remote.getTracks().forEach((t) => this.remote.removeTrack(t));
    this.chan?.close();
    this.chan = null;
  }
}
