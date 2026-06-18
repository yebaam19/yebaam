'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type {
  ClubEventLite,
  ClubMemberLite,
  ClubPromotionLite,
  ClubForoBoard,
} from '@/features/clubs/server/clubs.server';
import {
  CalendarIcon,
  MapPinIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
} from '@/components/icons/heroicons-shim';

import { ClubMemberPicker } from './ClubMemberPicker';
import type { ClubCategory } from '@/features/clubs/types/club.types';

export function MembersPanel({
  members,
  clubId,
  canManage,
  subcategory,
  category,
}: {
  members: ClubMemberLite[];
  clubId: string;
  canManage?: boolean;
  subcategory?: string;
  category?: ClubCategory;
}) {
  const t = useTranslations('clubes.panels.members');
  const tRoles = useTranslations('clubes.roles');
  return (
    <div className="space-y-4">
      {canManage && (
        <ClubMemberPicker clubId={clubId} subcategory={subcategory} category={category} />
      )}
      {!members.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('empty')}</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center gap-3 rounded-md border border-gray-200 p-2 dark:border-gray-700"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                {m.avatarUrl ? (
                  <Image src={m.avatarUrl} alt={m.displayName ?? 'user'} fill sizes="40px" unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <UserCircleIcon className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {m.displayName || m.username || t('fallbackName')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {tRoles(m.role)} · {m.membershipTier}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EventsPanel({ events }: { events: ClubEventLite[] }) {
  const t = useTranslations('clubes.panels.events');
  const locale = useLocale();
  if (!events.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t('empty')}</p>;
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
              {new Date(e.startsAt).toLocaleString(locale)}
            </span>
            {e.location && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {e.location}
              </span>
            )}
            <span>{t('attendees', { count: e.attendeesCount })}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PromotionsPanel({ promotions }: { promotions: ClubPromotionLite[] }) {
  const t = useTranslations('clubes.panels.promotions');
  if (!promotions.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t('empty')}</p>;
  }
  return (
    <ul className="space-y-3">
      {promotions.map((p) => (
        <li key={p.id} className="flex gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700">
          {p.imageUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
              <Image src={p.imageUrl} alt={p.title} fill sizes="64px" unoptimized className="object-cover" />
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
                {t('more')} <ArrowTopRightOnSquareIcon className="h-3 w-3" />
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
  foroBoard,
}: {
  foroSpaceSlug: string | null;
  foroBoard: ClubForoBoard;
}) {
  const t = useTranslations('clubes.panels.foro');
  if (!foroSpaceSlug || !foroBoard) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('notEnabled')}
      </p>
    );
  }

  const totalForums = foroBoard.categories.reduce(
    (acc, c) => acc + c.forums.length,
    0,
  );
  const totalTopics = foroBoard.categories.reduce(
    (acc, c) => acc + c.forums.reduce((f, forum) => f + (forum.topicCount ?? 0), 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
        {t('summary', { forums: totalForums, topics: totalTopics })}
      </div>

      {foroBoard.categories.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('emptyCategories')}
        </p>
      ) : (
        foroBoard.categories.map((cat) => (
          <section key={cat.id}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {cat.name}
            </h3>
            <ul className="space-y-2">
              {cat.forums.map((forum) => (
                <li
                  key={forum.id}
                  className="rounded-md border border-gray-200 p-2 dark:border-gray-700"
                >
                  <Link
                    href={`/foro/${foroSpaceSlug}/${forum.slug}`}
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {forum.name}
                        </div>
                        {forum.description && (
                          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {forum.description}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-gray-500 dark:text-gray-400">
                        <div>{t('topicsCount', { count: forum.topicCount ?? 0 })}</div>
                        <div>{t('postsCount', { count: forum.postCount ?? 0 })}</div>
                      </div>
                    </div>
                    {forum.lastTopicTitle && forum.lastTopicSlug && (
                      <div className="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {t('lastTopic', { title: forum.lastTopicTitle })}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
              {cat.forums.length === 0 && (
                <li className="text-xs text-gray-400">{t('emptyForumsInCategory')}</li>
              )}
            </ul>
          </section>
        ))
      )}

      <Link
        href={`/foro/${foroSpaceSlug}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
      >
        {t('openFull')}
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function PublicChatPanel({ publicChatId }: { publicChatId: string | null }) {
  const t = useTranslations('clubes.panels.publicChat');
  if (!publicChatId) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('notEnabled')}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('description')}
      </p>
      <Link
        href={`/chat/${publicChatId}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        {t('enter')}
      </Link>
    </div>
  );
}
