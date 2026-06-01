'use client';

import { useTranslations } from 'next-intl';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import { VideoCameraSlashIcon } from '@/components/icons/heroicons-shim';
import type { CallPeer, CallPhase, CallType } from '../types';
import CallVideo from './CallVideo';
import CallControls from './CallControls';

interface Props {
  peer: CallPeer;
  phase: CallPhase;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEnd: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

/**
 * Full-screen call surface, rendered at the app root so it is never clipped by
 * the 328px chat bubble. Remote stream fills the screen on a connected video
 * call; otherwise we show the peer avatar + status. The remote element is always
 * mounted (hidden in voice mode) so its audio plays.
 */
export default function CallActiveOverlay({
  peer,
  phase,
  callType,
  localStream,
  remoteStream,
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onEnd,
}: Props) {
  const t = useTranslations('chat.call');
  const showRemoteVideo = callType === 'video' && phase === 'active' && !!remoteStream;
  const statusText =
    phase === 'active' ? (callType === 'video' ? '' : t('connected')) : phase === 'connecting' ? t('connecting') : t('calling');

  return (
    <div className="fixed inset-0 z-[280] flex flex-col bg-neutral-950 text-white">
      {/* Remote stage */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {remoteStream && (
          <CallVideo
            stream={remoteStream}
            className={cn(
              showRemoteVideo
                ? 'absolute inset-0 h-full w-full bg-black object-cover'
                : 'pointer-events-none absolute h-px w-px opacity-0',
            )}
          />
        )}

        {!showRemoteVideo && (
          <div className="z-10 flex flex-col items-center gap-4 px-6 text-center">
            <Avatar
              className="h-28 w-28 border-2 border-white/20"
              src={peer.avatar}
              initials={initials(peer.name)}
            />
            <div>
              <h2 className="text-2xl font-semibold">{peer.name}</h2>
              {statusText && <p className="mt-1 text-sm text-white/70">{statusText}</p>}
            </div>
          </div>
        )}

        {/* Connected video call: name overlay top-left */}
        {showRemoteVideo && (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-black/40 px-3 py-1 text-sm font-medium backdrop-blur">
            {peer.name}
          </div>
        )}

        {/* Local preview (video calls only) */}
        {callType === 'video' && (
          <div className="absolute bottom-28 right-4 z-20 h-40 w-28 overflow-hidden rounded-xl border border-white/20 bg-neutral-900 shadow-lg sm:h-44 sm:w-32">
            {camOn && localStream ? (
              <CallVideo stream={localStream} muted mirror className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/40">
                <VideoCameraSlashIcon className="h-7 w-7" aria-hidden />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4">
        <CallControls
          callType={callType}
          micOn={micOn}
          camOn={camOn}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onEnd={onEnd}
        />
      </div>
    </div>
  );
}
