'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { EyeSlashIcon, MinusIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { useAnonChatStore } from '../store/anon-chat.store';
import { useAnonymousConversation } from '../hooks/useAnonymousConversation';
import type { AnonSession } from '../types';
import EphemeralMessagesList from './EphemeralMessagesList';
import EphemeralChatInput from './EphemeralChatInput';

interface AnonymousChatBubbleProps {
  session: AnonSession;
  position: number;
  baseOffset?: number;
}

const BUBBLE_WIDTH = 328;

/**
 * Facebook-style docked window for an anonymous (ephemeral) conversation.
 * Mirrors ChatBubble's footprint/stacking but is backed entirely by the
 * Broadcast hook — closing it ends the chat and erases everything.
 */
export default function AnonymousChatBubble({
  session,
  position,
  baseOffset = 320,
}: AnonymousChatBubbleProps) {
  const t = useTranslations('chat.anonymous');
  const closeSession = useAnonChatStore((s) => s.closeSession);
  const [isMinimized, setIsMinimized] = useState(false);

  const { messages, isPeerTyping, sendText, sendMedia, notifyTyping, leave } = useAnonymousConversation({
    session,
    onEnded: (reason) => {
      if (reason === 'peer-left') toast(t('toasts.peerLeft'));
      closeSession(session.channelKey);
    },
  });

  const rightPosition = baseOffset + position * (BUBBLE_WIDTH + 12);

  return (
    <div
      className={cn(
        'fixed bottom-0 z-[150] flex w-[328px] flex-col rounded-t-xl border border-neutral-200/90 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] dark:border-neutral-700 dark:bg-neutral-900',
        isMinimized ? 'h-14' : 'h-[480px]',
      )}
      style={{ right: `${rightPosition}px` }}
    >
      <div className="flex items-center justify-between rounded-t-xl border-b border-neutral-200/90 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <EyeSlashIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold leading-tight text-neutral-900 dark:text-white">
              {session.peerNick}
            </h3>
            <p className="truncate text-[11px] text-primary-600 dark:text-primary-400">
              {t('window.ephemeralNotice')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setIsMinimized((v) => !v)}
            className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
            title={t('window.title')}
          >
            <MinusIcon className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={leave}
            className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
            title={t('invite.close')}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <EphemeralMessagesList messages={messages} isPeerTyping={isPeerTyping} peerNick={session.peerNick} />
          <EphemeralChatInput onSend={sendText} onTyping={notifyTyping} onSendMedia={sendMedia} />
        </>
      )}
    </div>
  );
}
