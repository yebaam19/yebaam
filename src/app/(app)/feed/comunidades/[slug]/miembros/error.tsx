'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';

export default function CommunityMembersError({ reset }: { reset: () => void }) {
  const t = useTranslations('communities.members');
  return <div className="rounded-xl border border-primary-100 bg-white p-5 dark:border-primary-900 dark:bg-neutral-800">
    <p role="alert" className="mb-3 text-sm text-neutral-700 dark:text-neutral-200">{t('loadError')}</p>
    <Button outline onClick={reset}>{t('retry')}</Button>
  </div>;
}
