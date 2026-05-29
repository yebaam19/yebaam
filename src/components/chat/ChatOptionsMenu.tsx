'use client';

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EllipsisVerticalIcon, EyeSlashIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import AnonymousChatInviteDialog from '@/features/anonymous-chat/components/AnonymousChatInviteDialog';

interface ChatOptionsMenuProps {
  /** Real user id of the chat peer — the person who'd be invited. */
  recipientId: string;
  className?: string;
}

/**
 * Kebab dropdown for a chat header (the Facebook-style options menu). Currently
 * hosts the "Conversación anónima" entry; more items can be added later. Owns
 * the invite dialog so callers just drop `<ChatOptionsMenu recipientId=… />`
 * into a header action row.
 */
export default function ChatOptionsMenu({ recipientId, className }: ChatOptionsMenuProps) {
  const t = useTranslations('chat.anonymous');
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <Menu as="div" className={cn('relative', className)}>
        <MenuButton
          className="rounded-full p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title={t('options')}
          aria-label={t('options')}
        >
          <EllipsisVerticalIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </MenuButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 z-[160] mt-1 w-60 origin-top-right rounded-xl border border-neutral-200 bg-white py-1 shadow-lg focus:outline-none dark:border-neutral-700 dark:bg-neutral-900">
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-800 dark:text-neutral-100',
                    focus && 'bg-neutral-100 dark:bg-neutral-800',
                  )}
                >
                  <EyeSlashIcon className="h-5 w-5 shrink-0 text-primary-600" />
                  {t('menuItem')}
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>

      <AnonymousChatInviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        recipientId={recipientId}
      />
    </>
  );
}
