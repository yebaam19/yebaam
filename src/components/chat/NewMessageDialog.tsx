'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatStore } from '@/features/chat/store/chat.store';
import { chatHrefForConversation } from '@/features/chat/lib/chatHrefForConversation';
import { ConversationType, type Conversation } from '@/features/chat/types';
import { useIsXl } from '@/lib/hooks/useIsXl';
import { uploadService } from '@/lib/service/upload.service';
import { supabase } from '@/utils/supabase/client';
import UserRow, { displayNameFor, type SearchResult } from './NewMessageDialog/UserRow';
import GroupComposer from './NewMessageDialog/GroupComposer';

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  /** When true (header entry), the created chat opens as a floating bubble on desktop instead of navigating. */
  openInBubble?: boolean;
  /** Pre-select this person (e.g. "Crear grupo" from a 1:1 bubble → start a salita including them). */
  initialPeer?: { id: string; name: string; avatar?: string };
}

const SEARCH_DEBOUNCE_MS = 250;

export default function NewMessageDialog({ open, onClose, openInBubble = false, initialPeer }: NewMessageDialogProps) {
  const t = useTranslations('chat.newMessage');
  const router = useRouter();
  const isXl = useIsXl();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, SearchResult>>(new Map());
  const [groupName, setGroupName] = useState('');
  const [photo, setPhoto] = useState<{ id: string; url: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const friends = useFriendshipsStore((state) => state.friends);
  const fetchFriends = useFriendshipsStore((state) => state.fetchFriends);
  const addConversation = useChatStore((state) => state.addConversation);
  const openBubble = useChatStore((state) => state.openBubble);

  useEffect(() => {
    if (open) void fetchFriends();
  }, [open, fetchFriends]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setRemoteResults([]);
      setPendingId(null);
      setSelected(new Map());
      setGroupName('');
      setPhoto(null);
      setIsUploading(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Pre-select the seeding peer when opened from a 1:1 bubble's "Crear grupo".
  const initialPeerId = initialPeer?.id;
  useEffect(() => {
    if (open && initialPeer) {
      setSelected(
        new Map([
          [
            initialPeer.id,
            {
              id: initialPeer.id,
              username: '',
              firstName: initialPeer.name,
              lastName: '',
              avatar: initialPeer.avatar,
              isFriend: true,
            },
          ],
        ]),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPeerId]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const friendResults = useMemo<SearchResult[]>(
    () =>
      friends.map((f) => ({
        id: f.friendId,
        username: f.username ?? '',
        firstName: f.firstName ?? '',
        lastName: f.lastName ?? '',
        avatar: f.avatar,
        isFriend: true,
      })),
    [friends],
  );

  const filteredFriends = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery) return friendResults;
    const needle = debouncedQuery.toLowerCase();
    return friendResults.filter((f) => {
      const name = `${f.firstName} ${f.lastName}`.toLowerCase();
      return name.includes(needle) || f.username.toLowerCase().includes(needle);
    });
  }, [friendResults, debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setRemoteResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    (async () => {
      const friendIds = new Set(friendResults.map((f) => f.id));
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url')
        .or(`username.ilike.%${debouncedQuery}%,first_name.ilike.%${debouncedQuery}%,last_name.ilike.%${debouncedQuery}%`)
        .limit(10);
      if (cancelled) return;
      if (error) {
        console.warn('[NewMessageDialog] profile search failed', error);
        setRemoteResults([]);
      } else {
        type ProfileRow = { id: string; username: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null };
        const rows = ((data ?? []) as ProfileRow[]).filter((row) => row.id !== currentUserId && !friendIds.has(row.id));
        setRemoteResults(
          rows.map((row) => ({
            id: row.id,
            username: row.username ?? '',
            firstName: row.first_name ?? '',
            lastName: row.last_name ?? '',
            avatar: row.avatar_url ?? undefined,
            isFriend: false,
          })),
        );
      }
      setIsSearching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, currentUserId, friendResults]);

  const toggleFriend = (user: SearchResult) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user);
      return next;
    });
  };

  const openConversation = (conv: Conversation) => {
    addConversation(conv);
    const isGroup = conv.type === ConversationType.GROUP;
    if (openInBubble && isXl) {
      const peerId = isGroup ? null : conv.participantIds.find((id) => id !== currentUserId) ?? null;
      openBubble({
        contactId: isGroup ? conv.id : peerId ?? conv.id,
        conversationId: isGroup ? conv.id : undefined,
        type: conv.type,
        contactName: conv.name ?? t('userFallback'),
        contactAvatar: conv.avatar ?? '',
        isOnline: false,
      });
    } else if (currentUserId) {
      router.push(chatHrefForConversation(conv, currentUserId) as Route);
    }
    onClose();
  };

  // Non-friends can only start a direct chat (groups are friends-only, server-enforced).
  const openDirect = async (user: SearchResult) => {
    if (pendingId || isSubmitting) return;
    setPendingId(user.id);
    try {
      openConversation(await chatService.createOrGetConversation(user.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.openConversation'));
    } finally {
      setPendingId(null);
    }
  };

  const handlePickPhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('errors.photoUpload'));
      return;
    }
    setIsUploading(true);
    try {
      const { id, url } = await uploadService.uploadImage(file);
      setPhoto({ id, url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.photoUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const selectedList = useMemo(() => Array.from(selected.values()), [selected]);

  const createGroup = async () => {
    if (isSubmitting || isUploading || selectedList.length < 2) return;
    setIsSubmitting(true);
    try {
      const conv = await chatService.createGroupConversation(
        selectedList.map((u) => u.id),
        groupName.trim() || undefined,
        photo?.id,
      );
      openConversation(conv);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.createGroup'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showRemote = debouncedQuery.length >= 2 && remoteResults.length > 0;
  const nothingFound =
    debouncedQuery.length >= 2 && !isSearching && filteredFriends.length === 0 && remoteResults.length === 0;
  // Group intent: launched from a 1:1 bubble's "Crear grupo" with a seed person.
  // Skip the single-direct shortcut and surface the group composer right away.
  const groupIntent = Boolean(initialPeer);
  const onlySelected = selectedList.length === 1 ? selectedList[0] : null;
  const showGroupComposer = selectedList.length >= 2 || (groupIntent && selectedList.length >= 1);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={onClose}>
        <TransitionChild as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{t('title')}</h2>
                  <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label={t('closeAriaLabel')}>
                    <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                  </button>
                </div>

                <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className="w-full rounded-full bg-neutral-100 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-neutral-800"
                    />
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{t('composeHint')}</p>
                </div>

                <div className="max-h-[50vh] overflow-y-auto">
                  {filteredFriends.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('friends')}</div>
                      {filteredFriends.map((user) => (
                        <UserRow key={user.id} user={user} selectable selected={selected.has(user.id)} disabled={isSubmitting} onClick={() => toggleFriend(user)} />
                      ))}
                    </div>
                  )}

                  {showRemote && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('otherPeople')}</div>
                      {remoteResults.map((user) => (
                        <UserRow key={user.id} user={user} selectable={false} pending={pendingId === user.id} disabled={!!pendingId || isSubmitting} onClick={() => openDirect(user)} />
                      ))}
                    </div>
                  )}

                  {isSearching && debouncedQuery.length >= 2 && (
                    <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">{t('searching')}</div>
                  )}
                  {nothingFound && (
                    <div className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('noResults', { query: debouncedQuery })}</div>
                  )}
                  {!debouncedQuery && filteredFriends.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('noFriendsYet')}</div>
                  )}
                </div>

                {onlySelected && !groupIntent && (
                  <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => openDirect(onlySelected)}
                      disabled={!!pendingId}
                      className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {pendingId ? t('opening') : t('sendMessageTo', { name: displayNameFor(onlySelected, t('userFallback')) })}
                    </button>
                  </div>
                )}

                {showGroupComposer && (
                  <GroupComposer
                    selected={selectedList}
                    name={groupName}
                    onNameChange={setGroupName}
                    photoPreview={photo?.url ?? null}
                    isUploading={isUploading}
                    canCreate={selectedList.length >= 2}
                    isSubmitting={isSubmitting}
                    onPickPhoto={handlePickPhoto}
                    onRemovePhoto={() => setPhoto(null)}
                    onCreate={createGroup}
                    onRemoveMember={(id) => setSelected((prev) => {
                      const next = new Map(prev);
                      next.delete(id);
                      return next;
                    })}
                  />
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
