'use client';

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { EyeSlashIcon } from '@/components/icons/heroicons-shim';
import { anonymousChatService } from '../services/anonymous-chat.service';
import { useAnonChatStore } from '../store/anon-chat.store';

const NICK_MAX = 24;

/**
 * Global recipient-side prompt. Renders when an invite lands on the store (from
 * the private invite channel / catch-up fetch). Nick-only — the requester's
 * identity is never shown. Mount once, next to the bubble tray.
 */
export default function AnonymousChatInvitePrompt() {
  const t = useTranslations('chat.anonymous.prompt');
  const invite = useAnonChatStore((s) => s.incomingInvite);
  const setIncomingInvite = useAnonChatStore((s) => s.setIncomingInvite);
  const openSession = useAnonChatStore((s) => s.openSession);

  const [phase, setPhase] = useState<'ask' | 'nick'>('ask');
  const [nick, setNick] = useState('');
  const [busy, setBusy] = useState(false);

  // Fresh state per invite.
  useEffect(() => {
    setPhase('ask');
    setNick('');
    setBusy(false);
  }, [invite?.inviteId]);

  // Auto-dismiss once the invite's short TTL elapses.
  useEffect(() => {
    if (!invite) return;
    const ms = new Date(invite.expiresAt).getTime() - Date.now();
    if (ms <= 0) {
      setIncomingInvite(null);
      return;
    }
    const timer = setTimeout(() => setIncomingInvite(null), ms);
    return () => clearTimeout(timer);
  }, [invite, setIncomingInvite]);

  const close = () => setIncomingInvite(null);

  const handleReject = async () => {
    if (!invite || busy) return;
    setBusy(true);
    try {
      await anonymousChatService.respondInvite(invite.inviteId, false);
    } catch {
      /* rejection is best-effort; the row expires regardless */
    } finally {
      setIncomingInvite(null);
    }
  };

  const handleAccept = async () => {
    if (!invite || busy) return;
    const trimmed = nick.trim();
    if (!trimmed) return;
    if (trimmed.length > NICK_MAX) return;
    setBusy(true);
    try {
      const accepted = await anonymousChatService.respondInvite(invite.inviteId, true, trimmed);
      if (!accepted) {
        toast.error(t('expired'));
        setIncomingInvite(null);
        return;
      }
      openSession({
        inviteId: accepted.inviteId,
        channelKey: accepted.channelKey,
        myNick: accepted.recipientNick,
        peerNick: accepted.requesterNick,
        role: 'recipient',
      });
      setIncomingInvite(null);
    } catch {
      toast.error(t('expired'));
      setIncomingInvite(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Transition appear show={Boolean(invite)} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={close}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
                <div className="flex flex-col items-center px-5 py-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <EyeSlashIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <DialogTitle className="text-base font-semibold text-neutral-900 dark:text-white">
                    {t('title')}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {t('description', { nick: invite?.requesterNick ?? '' })}
                  </p>
                  <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                    {t('ephemeralNote')}
                  </p>

                  {phase === 'ask' ? (
                    <div className="mt-5 grid w-full grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void handleReject()}
                        disabled={busy}
                        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        {t('reject')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhase('nick')}
                        disabled={busy}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {t('accept')}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 w-full text-left">
                      <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {t('nickLabel')}
                      </label>
                      <input
                        autoFocus
                        type="text"
                        value={nick}
                        maxLength={NICK_MAX}
                        onChange={(e) => setNick(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void handleAccept();
                          }
                        }}
                        placeholder={t('nickPlaceholder')}
                        className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => void handleAccept()}
                        disabled={busy || !nick.trim()}
                        className="mt-3 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {busy ? t('starting') : t('start')}
                      </button>
                    </div>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
