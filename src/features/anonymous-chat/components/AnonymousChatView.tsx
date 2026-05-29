'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { EyeSlashIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { useAnonChatStore } from '../store/anon-chat.store';
import { useAnonymousConversation } from '../hooks/useAnonymousConversation';
import type { AnonSession } from '../types';
import EphemeralMessagesList from './EphemeralMessagesList';
import EphemeralChatInput from './EphemeralChatInput';

const SHELL = 'flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] min-h-0 w-full flex-col bg-white dark:bg-neutral-900';

/**
 * Full-page surface for an anonymous conversation. The session lives only in
 * the in-memory store, so a hard reload legitimately drops it — we show an
 * "ended" state rather than trying to restore (there is no record to restore).
 */
export default function AnonymousChatView({ channelKey }: { channelKey: string }) {
  const session = useAnonChatStore((s) => s.sessions.find((x) => x.channelKey === channelKey));
  const t = useTranslations('chat.anonymous');
  const router = useRouter();

  if (!session) {
    return (
      <div className={`${SHELL} items-center justify-center gap-3 text-center`}>
        <EyeSlashIcon className="h-10 w-10 text-neutral-400" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('window.emptySubtitle')}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          {t('invite.close')}
        </button>
      </div>
    );
  }

  return <AnonymousChatViewInner session={session} />;
}

function AnonymousChatViewInner({ session }: { session: AnonSession }) {
  const t = useTranslations('chat.anonymous');
  const router = useRouter();
  const closeSession = useAnonChatStore((s) => s.closeSession);

  const { messages, isPeerTyping, sendText, sendMedia, notifyTyping, leave } = useAnonymousConversation({
    session,
    onEnded: (reason) => {
      if (reason === 'peer-left') toast(t('toasts.peerLeft'));
      closeSession(session.channelKey);
      router.back();
    },
  });

  return (
    <div className={SHELL}>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <EyeSlashIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">{session.peerNick}</h3>
            <p className="text-xs text-primary-600 dark:text-primary-400">{t('window.ephemeralNotice')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={leave}
          aria-label={t('invite.close')}
          className="rounded-full p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </button>
      </div>

      <EphemeralMessagesList messages={messages} isPeerTyping={isPeerTyping} peerNick={session.peerNick} />
      <EphemeralChatInput onSend={sendText} onTyping={notifyTyping} onSendMedia={sendMedia} />
    </div>
  );
}
