'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { MicrophoneIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import type { MessageMedia } from '@/features/chat/types';
import { useVoiceRecorder } from '@/features/chat/hooks/useVoiceRecorder';
import { uploadChatVoiceNote } from '@/features/chat/lib/uploadChatVoiceNote';

const MIN_SECONDS = 1;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

/**
 * WhatsApp-style hold-to-record voice note button. Press to record, release to
 * send (uploads to R2, then sends an audio message). Recordings under 1s are
 * discarded.
 */
export default function VoiceRecorderButton({
  onSend,
  disabled,
}: {
  onSend: (media: MessageMedia) => void | Promise<void>;
  disabled?: boolean;
}) {
  const t = useTranslations('chat.voice');
  const { isRecording, seconds, start, stop, cancel } = useVoiceRecorder();
  const [uploading, setUploading] = useState(false);

  const begin = async () => {
    if (disabled || uploading || isRecording) return;
    const ok = await start();
    if (!ok) toast.error(t('denied'));
  };

  const finish = async () => {
    if (!isRecording) return;
    const rec = await stop();
    if (!rec) return;
    if (rec.duration < MIN_SECONDS) {
      toast.info(t('tooShort'));
      return;
    }
    setUploading(true);
    try {
      const media = await uploadChatVoiceNote(rec.blob, rec.mime, rec.duration);
      await onSend(media);
    } catch {
      toast.error(t('failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || uploading}
      onPointerDown={(e) => {
        e.preventDefault();
        void begin();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        void finish();
      }}
      onPointerLeave={() => {
        if (isRecording) void finish();
      }}
      onPointerCancel={() => cancel()}
      title={t('hold')}
      aria-label={t('hold')}
      className={cn(
        'flex h-9 min-w-9 items-center justify-center rounded-full px-2 transition-colors',
        isRecording
          ? 'bg-red-500 text-white'
          : 'text-[#0084ff] hover:bg-black/5 dark:text-blue-400 dark:hover:bg-white/10',
        (disabled || uploading) && 'opacity-50',
      )}
    >
      {isRecording ? (
        <span className="text-xs font-semibold tabular-nums">● {fmt(seconds)}</span>
      ) : (
        <MicrophoneIcon className="h-6 w-6" aria-hidden />
      )}
    </button>
  );
}
