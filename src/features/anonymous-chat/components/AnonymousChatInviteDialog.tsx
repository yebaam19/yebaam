'use client';

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { EyeSlashIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { subscribeToBroadcast, unsubscribe } from '@/utils/supabase/realtime';
import { anonymousChatService, AnonInviteBlockedError } from '../services/anonymous-chat.service';
import { useAnonChatStore } from '../store/anon-chat.store';
import { anonInvitePingTopic } from '../types';

const NICK_MAX = 24;

interface AnonymousChatInviteDialogProps {
  open: boolean;
  onClose: () => void;
  /** Real user id of the person being invited (the requester is not anonymous to themselves). */
  recipientId: string;
}

type Phase = 'compose' | 'waiting' | 'rejected';

export default function AnonymousChatInviteDialog({
  open,
  onClose,
  recipientId,
}: AnonymousChatInviteDialogProps) {
  const t = useTranslations('chat.anonymous.invite');
  const tToasts = useTranslations('chat.anonymous.toasts');
  const openSession = useAnonChatStore((s) => s.openSession);
  const [nick, setNick] = useState('');
  const [phase, setPhase] = useState<Phase>('compose');
  const [sending, setSending] = useState(false);
  const [inviteId, setInviteId] = useState<string | null>(null);

  // Reset whenever the dialog opens fresh.
  useEffect(() => {
    if (open) {
      setNick('');
      setPhase('compose');
      setSending(false);
      setInviteId(null);
    }
  }, [open]);

  // Requester side of the handshake: while waiting, listen for the recipient's
  // response ping (keyed on inviteId, never on their identity) and PULL the
  // outcome via an RLS'd RPC.
  // Known limitation (v1): if the requester closes this dialog before the
  // recipient responds, the ping is missed and the session won't auto-open.
  useEffect(() => {
    if (!inviteId || phase !== 'waiting') return;
    let done = false;

    const resolve = async () => {
      if (done) return;
      const result = await anonymousChatService.getSentInviteStatus(inviteId);
      if (done) return;
      if (result.status === 'accepted' && result.channelKey && result.recipientNick) {
        done = true;
        openSession({
          inviteId,
          channelKey: result.channelKey,
          myNick: nick.trim(),
          peerNick: result.recipientNick,
          role: 'requester',
        });
        toast.success(tToasts('accepted', { nick: result.recipientNick }));
        onClose();
      } else if (result.status === 'rejected' || result.status === 'expired') {
        done = true;
        setPhase('rejected');
      }
    };

    const channel = subscribeToBroadcast({
      channel: anonInvitePingTopic(inviteId),
      event: 'ping',
      onMessage: () => void resolve(),
    });
    // Fallback poll in case the ping is dropped — cheap for a single waiter.
    const poll = setInterval(() => void resolve(), 4000);

    return () => {
      done = true;
      clearInterval(poll);
      unsubscribe(channel);
    };
  }, [inviteId, phase, nick, openSession, onClose, tToasts]);

  const handleSend = async () => {
    const trimmed = nick.trim();
    if (!trimmed) {
      toast.error(t('errors.nickRequired'));
      return;
    }
    if (trimmed.length > NICK_MAX) {
      toast.error(t('errors.nickTooLong'));
      return;
    }
    setSending(true);
    try {
      const result = await anonymousChatService.sendInvite(recipientId, trimmed);
      setInviteId(result.inviteId);
      setPhase('waiting');
    } catch (err) {
      const message =
        err instanceof AnonInviteBlockedError || err instanceof Error
          ? err.message
          : t('errors.nickRequired');
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={onClose}>
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
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                  <DialogTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
                    <EyeSlashIcon className="h-5 w-5 text-primary-600" />
                    {t('title')}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label={t('close')}
                  >
                    <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                  </button>
                </div>

                <div className="px-4 py-4">
                  {phase === 'compose' && (
                    <>
                      <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {t('description')}
                      </p>
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
                            void handleSend();
                          }
                        }}
                        placeholder={t('nickPlaceholder')}
                        className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={sending}
                        className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                      >
                        {sending ? t('sending') : t('send')}
                      </button>
                    </>
                  )}

                  {phase === 'waiting' && (
                    <div className="py-6 text-center">
                      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {t('waitingTitle')}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {t('waitingDescription', { nick: nick.trim() })}
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-5 rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  )}

                  {phase === 'rejected' && (
                    <div className="py-6 text-center">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {t('rejectedTitle')}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {t('rejectedDescription')}
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                      >
                        {t('close')}
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
