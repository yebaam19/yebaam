'use client';

import { EllipsisHorizontalIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Search01Icon, UserAdd01Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface OnlineContact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
}

interface OnlineContactsProps {
  contacts: OnlineContact[];
  onContactClick: (contact: OnlineContact) => void;
}

export default function OnlineContacts({ contacts, onContactClick }: OnlineContactsProps) {
  const t = useTranslations('nav');
  const onlineCount = contacts.filter(c => c.isOnline).length;
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [query, setQuery] = useState('');

  const filteredContacts = contacts.filter((c) => {
    if (showOnlineOnly && !c.isOnline) return false;
    if (query.trim() && !c.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t('contactsWithCount', { online: onlineCount, total: contacts.length })}
        </h3>
        <Popover className="relative">
          <PopoverButton
            aria-label={t('contactOptions')}
            className="rounded-lg p-1 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-800"
          >
            <EllipsisHorizontalIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </PopoverButton>
          <PopoverPanel
            transition
            anchor={{ to: 'bottom end', gap: 8 }}
            className="z-40 w-64 rounded-xl bg-white shadow-lg ring-1 ring-black/5 transition duration-150 ease-in-out data-closed:translate-y-1 data-closed:opacity-0 dark:bg-neutral-800 dark:ring-white/10"
          >
            {({ close }) => (
              <div className="flex flex-col p-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOnlineOnly((v) => !v);
                    close();
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-700"
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        showOnlineOnly ? 'bg-green-500' : 'border border-neutral-400'
                      }`}
                    />
                  </span>
                  {showOnlineOnly ? t('showAll') : t('onlineOnly')}
                </button>
                <Link
                  href="/feed/friends"
                  onClick={() => close()}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-700"
                >
                  <HugeiconsIcon
                    icon={UserMultiple02Icon}
                    size={20}
                    strokeWidth={1.5}
                    className="text-neutral-500 dark:text-neutral-300"
                  />
                  {t('viewAllFriends')}
                </Link>
                <Link
                  href="/feed/friends?tab=suggestions"
                  onClick={() => close()}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-700"
                >
                  <HugeiconsIcon
                    icon={UserAdd01Icon}
                    size={20}
                    strokeWidth={1.5}
                    className="text-neutral-500 dark:text-neutral-300"
                  />
                  {t('addFriends')}
                </Link>
                <Link
                  href="/feed/friends?tab=search"
                  onClick={() => close()}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-700"
                >
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={20}
                    strokeWidth={1.5}
                    className="text-neutral-500 dark:text-neutral-300"
                  />
                  {t('searchContacts')}
                </Link>
              </div>
            )}
          </PopoverPanel>
        </Popover>
      </div>
      {contacts.length > 0 && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchContactPlaceholder')}
          className="mb-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
        />
      )}
      <div className="space-y-1">
        {contacts.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            {t('noFriendsYet')}
          </p>
        ) : filteredContacts.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            {t('noResults')}
          </p>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {/* Avatar - Link al perfil */}
              <Link 
                href={`/${contact.username}`}
                className="relative shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar
                  className="h-9 w-9"
                  src={contact.avatar}
                  initials={contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                />
                {contact.isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
                )}
              </Link>
              
              {/* Nombre - Abre el chat */}
              <button
                type="button"
                aria-label={t('openChatWith', { name: contact.name })}
                onClick={() => onContactClick(contact)}
                className="flex min-h-11 min-w-0 flex-1 items-center rounded-lg text-left hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:hover:bg-neutral-800"
              >
                <span className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {contact.name}
                </span>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
