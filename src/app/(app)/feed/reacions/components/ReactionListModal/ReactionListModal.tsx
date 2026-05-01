'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import type { Route } from 'next';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { getUserInitials } from '@/lib/user-helpers';
import { reactionService } from '../../services/reaction.service';
import {
  REACTION_CONFIGS,
  ReactionType,
  type Reaction,
  type ReactionCounts,
} from '../../interfaces/reaction.interfaces';

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

                <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 px-2">
                  <TabButton
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    label="Todas"
                    count={total}
                  />
                  {REACTION_ORDER.map((type) => {
                    const c = counts[type] ?? 0;
                    if (c === 0) return null;
                    const config = REACTION_CONFIGS[type];
                    return (
                      <TabButton
                        key={type}
                        active={activeTab === type}
                        onClick={() => setActiveTab(type)}
                        label={config.emoji}
                        count={c}
                        title={config.label}
                      />
                    );
                  })}
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading && (
                    <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Cargando...
                    </div>
                  )}
                  {!isLoading && error && (
                    <div className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  {!isLoading && !error && filtered.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      No hay reacciones en esta categoría.
                    </div>
                  )}
                  {!isLoading && !error && filtered.length > 0 && (
                    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {filtered.map((reaction) => (
                        <ReactionRow key={reaction.id} reaction={reaction} onNavigate={onClose} />
                      ))}
                    </ul>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  title?: string;
}

function TabButton({ active, onClick, label, count, title }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1.5">
        <span>{label}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{count}</span>
      </span>
    </button>
  );
}

interface ReactionRowProps {
  reaction: Reaction;
  onNavigate: () => void;
}

function ReactionRow({ reaction, onNavigate }: ReactionRowProps) {
  const user = reaction.user;
  const config = REACTION_CONFIGS[reaction.type];
  const displayName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username
    : 'Usuario';
  const initials = getUserInitials(user?.username ?? '');
  const href = user?.username ? (`/${user.username}` as Route) : null;

  const content = (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative shrink-0">
        <Avatar src={user?.avatar} initials={initials} className="h-10 w-10" />
        <span
          aria-label={config.label}
          title={config.label}
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-700 text-sm"
        >
          {config.emoji}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
          {displayName}
        </p>
        {user?.username && (
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            @{user.username}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          onClick={onNavigate}
          className="block hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          {content}
        </Link>
      </li>
    );
  }
  return <li>{content}</li>;
}
