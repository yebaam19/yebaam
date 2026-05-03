'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MagnifyingGlassIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatStore } from '@/features/chat/store/chat.store';
import { supabase } from '@/utils/supabase/client';

interface ActiveChat {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onConversationOpened: (chat: ActiveChat) => void;
}

interface SearchResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isFriend: boolean;
}

const SEARCH_DEBOUNCE_MS = 250;

export default function NewMessageDialog({ open, onClose, onConversationOpened }: NewMessageDialogProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const friends = useFriendshipsStore((state) => state.friends);
  const fetchFriends = useFriendshipsStore((state) => state.fetchFriends);
  const addConversation = useChatStore((state) => state.addConversation);

  useEffect(() => {
    if (open) {
      void fetchFriends();
    }
  }, [open, fetchFriends]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setRemoteResults([]);
      setPendingId(null);
    }
  }, [open]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const friendResults = useMemo<SearchResult[]>(() => {
    return friends.map((f) => ({
      id: f.friendId,
      username: f.username ?? '',
      firstName: f.firstName ?? '',
      lastName: f.lastName ?? '',
      avatar: f.avatar,
      isFriend: true,
    }));
  }, [friends]);

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
        type ProfileRow = {
          id: string;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
        };
        const rows = ((data ?? []) as ProfileRow[]).filter(
          (row) => row.id !== currentUserId && !friendIds.has(row.id),
        );
        const results: SearchResult[] = rows.map((row) => ({
          id: row.id,
          username: row.username ?? '',
          firstName: row.first_name ?? '',
          lastName: row.last_name ?? '',
          avatar: row.avatar_url ?? undefined,
          isFriend: false,
        }));
        setRemoteResults(results);
      }
      setIsSearching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, currentUserId, friendResults]);

  const handleSelect = async (user: SearchResult) => {
    if (pendingId) return;
    setPendingId(user.id);
    try {
      const conversation = await chatService.createOrGetConversation(user.id);
      addConversation(conversation);
      const displayName = user.firstName
        ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim()
        : user.username || 'Usuario';
      const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
      onConversationOpened({
        id: user.id,
        name: displayName,
        avatar: user.avatar || fallbackAvatar,
        isOnline: false,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar la conversación';
      toast.error(message);
    } finally {
      setPendingId(null);
    }
  };

  const showRemote = debouncedQuery.length >= 2 && remoteResults.length > 0;
  const nothingFound =
    debouncedQuery.length >= 2 && !isSearching && filteredFriends.length === 0 && remoteResults.length === 0;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-60" onClose={onClose}>
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
              <DialogPanel className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Nuevo mensaje</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label="Cerrar"
                  >
                    <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                  </button>
                </div>

                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar amigos o personas"
                      className="w-full rounded-full bg-neutral-100 dark:bg-neutral-800 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {filteredFriends.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Amigos
                      </div>
                      {filteredFriends.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          pending={pendingId === user.id}
                          disabled={!!pendingId}
                          onSelect={() => handleSelect(user)}
                        />
                      ))}
                    </div>
                  )}

                  {showRemote && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Otras personas
                      </div>
                      {remoteResults.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          pending={pendingId === user.id}
                          disabled={!!pendingId}
                          onSelect={() => handleSelect(user)}
                        />
                      ))}
                    </div>
                  )}

                  {isSearching && debouncedQuery.length >= 2 && (
                    <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Buscando...</div>
                  )}

                  {nothingFound && (
                    <div className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Sin resultados para &quot;{debouncedQuery}&quot;
                    </div>
                  )}

                  {!debouncedQuery && filteredFriends.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Aún no tienes amigos. Busca a alguien por nombre o usuario.
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

interface UserRowProps {
  user: SearchResult;
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function UserRow({ user, pending, disabled, onSelect }: UserRowProps) {
  const displayName = user.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim()
    : user.username || 'Usuario';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Avatar src={user.avatar ?? null} alt={displayName} initials={initials} className="h-10 w-10" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{displayName}</div>
        {user.username && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">@{user.username}</div>
        )}
      </div>
      {pending && <span className="text-xs text-neutral-500">Abriendo...</span>}
    </button>
  );
}
