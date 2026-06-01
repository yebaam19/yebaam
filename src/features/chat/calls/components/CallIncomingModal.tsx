'use client';

import { Fragment } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import Avatar from '@/ui/Avatar';
import { PhoneIcon, PhoneXMarkIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim';
import type { CallPeer, CallType } from '../types';

interface Props {
  peer: CallPeer;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

export default function CallIncomingModal({ peer, callType, onAccept, onDecline }: Props) {
  const t = useTranslations('chat.call');
  const title = callType === 'video' ? t('incomingVideoCall') : t('incomingVoiceCall');

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-[300]" onClose={onDecline}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-neutral-900">
              <div className="mx-auto mb-4 w-fit">
                <span className="relative flex">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40" />
                  <Avatar
                    className="relative h-20 w-20 border-2 border-white shadow-lg dark:border-neutral-800"
                    src={peer.avatar}
                    initials={initials(peer.name)}
                  />
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
              <h2 className="mt-1 mb-6 truncate text-xl font-bold text-neutral-900 dark:text-white">
                {peer.name}
              </h2>

              <div className="flex items-center justify-center gap-10">
                <button
                  type="button"
                  onClick={onDecline}
                  aria-label={t('decline')}
                  title={t('decline')}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <PhoneXMarkIcon className="h-6 w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  aria-label={t('accept')}
                  title={t('accept')}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  {callType === 'video' ? (
                    <VideoCameraIcon className="h-6 w-6" aria-hidden />
                  ) : (
                    <PhoneIcon className="h-6 w-6" aria-hidden />
                  )}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
