'use client';

import { useTranslations } from 'next-intl';

interface InfoSectionProps {
  status: string;
  isAddressee: boolean;
}

export function InfoSection({ status, isAddressee }: InfoSectionProps) {
  const t = useTranslations('friendships.detailModal');

  return (
    <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-neutral-600 dark:text-neutral-400">{t('status')}</span>
        <span className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
          {status === 'pending' ? t('statusPending') : status}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-neutral-600 dark:text-neutral-400">{t('type')}</span>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {isAddressee ? t('typeReceived') : t('typeSent')}
        </span>
      </div>
    </div>
  );
}
