'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';

export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations('communities.plans');
  return <div className="space-y-4 rounded-xl bg-white p-6 dark:bg-gray-800">
    <p role="alert">{t('requestError')}</p>
    <Button color="blue" onClick={reset}>{t('retry')}</Button>
  </div>;
}
