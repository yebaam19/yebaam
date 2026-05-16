'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { getUserInitials } from '@/lib/user-helpers';
import {
  profileMediaInteractionsService,
  type EntityType,
  type Reaction,
  type ReactionType,
} from '@/features/profile/services/profile-media-interactions.service';

interface MediaReactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
}

const REACTION_ORDER: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

type TabKey = 'all' | ReactionType;

type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; key: string }
  | {
      status: 'ready';
      key: string;
      reactions: Reaction[];
      counts: Record<ReactionType, number>;
    }
  | { status: 'error'; key: string; message: string };

export default function MediaReactionListModal({
  isOpen,
  onClose,
  entityType,
  entityId,
}: MediaReactionListModalProps) {
  const t = useTranslations('profile.media.reactionList');
  const tLabels = useTranslations('profile.media.reactionButton');
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const cacheKey = `${entityType}:${entityId}`;

  useEffect(() => {
    if (!isOpen || !entityId) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setState({ status: 'loading', key: cacheKey });
      setActiveTab('all');
      try {
        const res = await profileMediaInteractionsService.getReactions(entityType, entityId);
        if (cancelled) return;
        setState({
          status: 'ready',
          key: cacheKey,
          reactions: res.reactions,
          counts: res.counts,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        setState({
          status: 'error',
          key: cacheKey,
          message: err instanceof Error ? err.message : t('errorFallback'),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, entityType, entityId, cacheKey, t]);

  const isLoading = state.status === 'loading' || (state.status === 'idle' && isOpen);
  const error = state.status === 'error' ? state.message : null;
  const counts =
    state.status === 'ready'
      ? state.counts
      : ({ like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 } as Record<ReactionType, number>);

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
                    {t('title')}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    aria-label={t('close')}
                  >
                    <XMarkIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                  </button>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 px-2">
                  <TabButton
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    label={t('tabAll')}
                    count={total}
                  />
                  {REACTION_ORDER.map((type) => {
                    const c = counts[type] ?? 0;
                    if (c === 0) return null;
                    return (
                      <TabButton
                        key={type}
                        active={activeTab === type}
                        onClick={() => setActiveTab(type)}
                        label={REACTION_EMOJIS[type]}
                        count={c}
                        title={tLabels(type)}
                      />
                    );
                  })}
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading && (
                    <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      {t('loading')}
                    </div>
                  )}
                  {!isLoading && error && (
                    <div className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  {!isLoading && !error && filtered.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      {t('emptyCategory')}
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
  const t = useTranslations('profile.media.reactionList');
  const tLabels = useTranslations('profile.media.reactionButton');
  const user = reaction.user;
  const emoji = REACTION_EMOJIS[reaction.type];
  const label = tLabels(reaction.type);
  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || t('fallbackUser');
  const initials = getUserInitials(user.username ?? '');
  const href = user.username ? (`/${user.username}` as Route) : null;

  const content = (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative shrink-0">
        <Avatar src={user.avatar} initials={initials} className="h-10 w-10" />
        <span
          aria-label={label}
          title={label}
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-700 text-sm"
        >
          {emoji}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
          {displayName}
        </p>
        {user.username && (
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
