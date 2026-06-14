'use client';

import { useTranslations, useLocale } from 'next-intl';
import { UsersIcon, DocumentTextIcon } from '@/components/icons/heroicons-shim';
import type { Group } from '@/features/groups/types/group.types';
import type { GroupDetailTab } from './GroupDetailTabs';

interface Props {
  activeTab: GroupDetailTab;
  group: Group;
}

/** Body below the group detail card — renders the panel for the active tab.
 *  Posts/members are placeholder empty states for now; About shows the group
 *  description and metadata. */
export function GroupDetailContent({ activeTab, group }: Props) {
  const t = useTranslations('grupos');
  const locale = useLocale();

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      {activeTab === 'posts' && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            {t('detail.posts.emptyTitle')}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('detail.posts.emptyDescription')}
          </p>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="text-center py-12">
          <UsersIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            {t('detail.membersTab.title', { count: group.memberCount })}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('detail.membersTab.description')}
          </p>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="max-w-3xl">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              {t('detail.about.descriptionTitle')}
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {group.description}
            </p>

            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                {t('detail.about.detailsTitle')}
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-neutral-600 dark:text-neutral-400">{t('detail.about.category')}</dt>
                  <dd className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                    {group.category}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600 dark:text-neutral-400">{t('detail.about.privacy')}</dt>
                  <dd className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                    {group.privacy === 'public'
                      ? t('detail.about.publicLabel')
                      : t('detail.about.privateLabel')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600 dark:text-neutral-400">{t('detail.about.createdOn')}</dt>
                  <dd className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                    {new Date(group.createdAt || '').toLocaleDateString(
                      locale === 'en' ? 'en-US' : 'es-ES',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
