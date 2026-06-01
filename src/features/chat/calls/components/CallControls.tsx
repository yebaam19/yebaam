'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from '@/components/icons/heroicons-shim';
import type { CallType } from '../types';

interface Props {
  callType: CallType;
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEnd: () => void;
}

const baseBtn =
  'flex h-12 w-12 items-center justify-center rounded-full transition-colors active:scale-95';

export default function CallControls({
  callType,
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onEnd,
}: Props) {
  const t = useTranslations('chat.call');

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onToggleMic}
        aria-pressed={!micOn}
        aria-label={micOn ? t('mute') : t('unmute')}
        title={micOn ? t('mute') : t('unmute')}
        className={cn(baseBtn, micOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-neutral-900')}
      >
        {micOn ? (
          <MicrophoneIcon className="h-5 w-5" aria-hidden />
        ) : (
          <MicrophoneSlashIcon className="h-5 w-5" aria-hidden />
        )}
      </button>

      {callType === 'video' && (
        <button
          type="button"
          onClick={onToggleCam}
          aria-pressed={!camOn}
          aria-label={camOn ? t('cameraOff') : t('cameraOn')}
          title={camOn ? t('cameraOff') : t('cameraOn')}
          className={cn(baseBtn, camOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-neutral-900')}
        >
          {camOn ? (
            <VideoCameraIcon className="h-5 w-5" aria-hidden />
          ) : (
            <VideoCameraSlashIcon className="h-5 w-5" aria-hidden />
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onEnd}
        aria-label={t('endCall')}
        title={t('endCall')}
        className={cn(baseBtn, 'w-14 bg-red-500 text-white hover:bg-red-600')}
      >
        <PhoneXMarkIcon className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}
