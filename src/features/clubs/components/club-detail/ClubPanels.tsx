'use client';

import Image from 'next/image';
import Link from 'next/link';
import type {
  ClubEventLite,
  ClubMemberLite,
  ClubPromotionLite,
} from '@/features/clubs/server/clubs.server';
import { CLUB_ROLE_LABELS } from '@/features/clubs/utils/clubHelpers';
import {
  CalendarIcon,
  MapPinIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
} from '@/components/icons/heroicons-shim';

export function MembersPanel({ members }: { members: ClubMemberLite[] }) {
  if (!members.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay miembros.</p>;
  }
  return (
    <ul className="space-y-2">
      {members.map((m) => (
        <li
          key={m.userId}
          className="flex items-center gap-3 rounded-md border border-gray-200 p-2 dark:border-gray-700"
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            {m.avatarUrl ? (
              <Image src={m.avatarUrl} alt={m.displayName ?? 'user'} fill unoptimized className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <UserCircleIcon className="h-7 w-7" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {m.displayName || m.username || 'Sin nombre'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {CLUB_ROLE_LABELS[m.role]} · {m.membershipTier}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EventsPanel({ events }: { events: ClubEventLite[] }) {
  if (!events.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No hay eventos programados.</p>;
  }
  return (
    <ul className="space-y-3">
      {events.map((e) => (
        <li
          key={e.id}
          className="rounded-md border border-gray-200 p-3 dark:border-gray-700"
        >
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{e.title}</div>
          {e.description && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{e.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              {new Date(e.startsAt).toLocaleString('es-ES')}
            </span>
            {e.location && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {e.location}
              </span>
            )}
            <span>{e.attendeesCount} asistentes</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PromotionsPanel({ promotions }: { promotions: ClubPromotionLite[] }) {
  if (!promotions.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No hay promociones activas.</p>;
  }
  return (
    <ul className="space-y-3">
      {promotions.map((p) => (
        <li key={p.id} className="flex gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700">
          {p.imageUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
              <Image src={p.imageUrl} alt={p.title} fill unoptimized className="object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-primary-600 dark:text-primary-400">
              {p.businessName}
            </div>
            <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {p.title}
            </div>
            {p.description && (
              <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                {p.description}
              </p>
            )}
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
              >
                Ver más <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ForoPanel({
  foroSpaceSlug,
}: {
  foroSpaceSlug: string | null;
}) {
  if (!foroSpaceSlug) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Este club aún no tiene foro habilitado.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        El foro del club funciona como un bulletin board: los miembros pueden abrir temas y responder en hilos.
      </p>
      <Link
        href={`/foro/${foroSpaceSlug}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
      >
        Abrir foro completo
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function PublicChatPanel({ publicChatId }: { publicChatId: string | null }) {
  if (!publicChatId) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        El chat público aún no está habilitado para este club.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Chat en tiempo real con todos los miembros del club.
      </p>
      <Link
        href={`/chat/${publicChatId}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        Entrar al chat público
      </Link>
    </div>
  );
}
