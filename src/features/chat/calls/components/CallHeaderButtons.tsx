'use client';

import { useTranslations } from 'next-intl';
import { PhoneIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim';
import { useCalls } from '../CallProvider';
import type { CallPeer } from '../types';

/**
 * Video + voice call buttons for a chat header. Renders nothing unless we have
 * both a conversation id and a known 1:1 peer (callers pass `peer = null` for
 * group threads to hide the controls).
 */
interface Props {
  conversationId?: string;
  peer: CallPeer | null;
  /** Tailwind classes for each icon button (defaults match the chat headers). */
  buttonClassName?: string;
  iconClassName?: string;
}

export default function CallHeaderButtons({
  conversationId,
  peer,
  buttonClassName = 'rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800',
  iconClassName = 'h-5 w-5',
}: Props) {
  const t = useTranslations('chat.call');
  const { startCall, isBusy } = useCalls();

  if (!conversationId || !peer?.id) return null;

  const start = (callType: 'video' | 'audio') => startCall({ conversationId, peer, callType });

  return (
    <>
      <button
        type="button"
        onClick={() => start('audio')}
        disabled={isBusy}
        title={t('voiceCall')}
        aria-label={t('voiceCall')}
        className={buttonClassName}
      >
        <PhoneIcon className={iconClassName} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => start('video')}
        disabled={isBusy}
        title={t('videoCall')}
        aria-label={t('videoCall')}
        className={buttonClassName}
      >
        <VideoCameraIcon className={iconClassName} aria-hidden />
      </button>
    </>
  );
}
