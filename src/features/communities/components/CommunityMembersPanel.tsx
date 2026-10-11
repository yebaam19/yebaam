import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { CheckBadgeIcon } from '@/components/icons/heroicons-shim';
import {
  getRoleColor,
  getRoleLabel,
} from '@/features/communities/utils/communityHelpers';
import type { CommunityMember } from '@/features/communities/types/community.types';

interface CommunityMembersPanelProps {
  members: CommunityMember[];
  total: number;
  restricted?: boolean;
  page?: number;
  pageSize?: number;
  slug?: string;
}

export async function CommunityMembersPanel({ members, total, restricted = false, page = 1, pageSize = 60, slug }: CommunityMembersPanelProps) {
  const t = await getTranslations('communities');
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const basePath = slug ? `/feed/comunidades/${encodeURIComponent(slug)}/miembros` : null;
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t('members.title')}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t('members.total', { count: total })}
        </span>
      </header>
      {restricted ? (
        <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-5 py-6 text-sm leading-relaxed text-primary-900 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-100">
          {t('members.restricted')}
        </div>
      ) : members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                {member.avatar && (
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    width={44}
                    height={44}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1 truncate">
                    {member.name}
                    {member.isVerified && (
                      <CheckBadgeIcon className="w-4 h-4 shrink-0 text-primary-800 dark:text-primary-300" />
                    )}
                  </p>
                  {member.username && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      @{member.username}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`inline-block text-[10px] font-medium px-2 py-1 rounded-full ${getRoleColor(member.role)}`}
              >
                {getRoleLabel(member.role)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('members.empty')}
        </div>
      )}
      {!restricted && basePath && pageCount > 1 && (
        <nav aria-label={t('members.pagination')} className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-700">
          <span className="text-neutral-600 dark:text-neutral-300">{t('members.pageStatus', { page, pageCount })}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={(page === 2 ? basePath : `${basePath}?page=${page - 1}`) as Route} className="inline-flex min-h-11 items-center rounded-lg border border-primary-200 px-4 font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:border-primary-700 dark:text-primary-200 dark:hover:bg-primary-900/30">{t('members.previous')}</Link>}
            {page < pageCount && <Link href={`${basePath}?page=${page + 1}` as Route} className="inline-flex min-h-11 items-center rounded-lg bg-primary-800 px-4 font-medium text-white hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">{t('members.next')}</Link>}
          </div>
        </nav>
      )}
    </div>
  );
}
