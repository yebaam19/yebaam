'use client';

import { EllipsisHorizontalIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import Link from 'next/link';

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
  const onlineCount = contacts.filter(c => c.isOnline).length;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Contactos ({onlineCount}/{contacts.length})
        </h3>
        <button className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <EllipsisHorizontalIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>
      <div className="space-y-1">
        {contacts.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            No tienes amigos aún
          </p>
        ) : (
          contacts.map((contact) => (
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
                onClick={() => onContactClick(contact)}
                className="flex-1 text-left"
              >
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {contact.name}
                </p>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
