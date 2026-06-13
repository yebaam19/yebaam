'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { reactionService } from '../../services/reaction.service';
import {
  ReactionType,
  type Reaction,
  type ReactionCounts,
} from '../../interfaces/reaction.interfaces';
import { ReactionTabs } from './ReactionTabs';
import { ReactorList } from './ReactorList';

interface ReactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

type TabKey = 'all' | ReactionType;

const REACTION_ORDER: ReactionType[] = [
  ReactionType.LIKE,
  ReactionType.LOVE,
  ReactionType.HAHA,
  ReactionType.WOW,
  ReactionType.SAD,
  ReactionType.ANGRY,
];

const EMPTY_COUNTS: ReactionCounts = {
  LIKE: 0,
  LOVE: 0,
  HAHA: 0,
  WOW: 0,
  SAD: 0,
  ANGRY: 0,
};

type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; key: string }
  | { status: 'ready'; key: string; reactions: Reaction[]; counts: ReactionCounts }
  | { status: 'error'; key: string; message: string };

export function ReactionListModal({ isOpen, onClose, postId }: ReactionListModalProps) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    if (!isOpen || !postId) return;
    let cancelled = false;
    // Schedule the loading flip and the fetch on the microtask queue so
    // setState happens off the synchronous effect body (the React team's
    // recommended way to pair an external request with an effect — see
    // react-hooks/set-state-in-effect).
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setState({ status: 'loading', key: postId });
      setActiveTab('all');
      try {
        const res = await reactionService.getByPost(postId, { limit: 200 });
        if (cancelled) return;
        setState({
          status: 'ready',
          key: postId,
          reactions: res.reactions,
          counts: res.counts,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        setState({
          status: 'error',
          key: postId,
          message: err instanceof Error ? err.message : 'Error al cargar reacciones',
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, postId]);

  const isLoading = state.status === 'loading' || (state.status === 'idle' && isOpen);
  const error = state.status === 'error' ? state.message : null;
  const counts = state.status === 'ready' ? state.counts : EMPTY_COUNTS;

  const total = useMemo(
    () => REACTION_ORDER.reduce((sum, t) => sum + (counts[t] ?? 0), 0),
    [counts],
  );

  const filtered = useMemo(() => {
    const reactions = state.status === 'ready' ? state.reactions : [];
    if (activeTab === 'all') return reactions;
    return reactions.filter((r) => r.type === activeTab);
  }, [state, activeTab]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 text-left align-middle shadow-2xl transition-all">
                <div className="relative border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
                  <Dialog.Title
                    as="h3"
                    className="text-base font-semibold text-center text-neutral-900 dark:text-white"
                  >
                    Reacciones
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Cerrar"
                  >
                    <XMarkIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                  </button>
                </div>

                <ReactionTabs
                  activeTab={activeTab}
                  counts={counts}
                  total={total}
                  onSelect={setActiveTab}
                />

                <ReactorList
                  isLoading={isLoading}
                  error={error}
                  reactions={filtered}
                  onNavigate={onClose}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
