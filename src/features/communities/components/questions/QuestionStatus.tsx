'use client';
import { useTranslations } from 'next-intl';
export function QuestionStatus({ isPublished, closed, faq, hidden }: { isPublished: boolean; closed?: boolean; faq?: boolean; hidden?: boolean }) {
  const t = useTranslations('communities.questions');
  return <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
    {!isPublished && <span className="text-secondary-900 dark:text-secondary-300">{t('private')}</span>}
    {hidden && <span className="text-red-700 dark:text-red-300">{t('hidden')}</span>}
    {faq && <span className="text-primary-800 dark:text-primary-300">{t('faq')}</span>}
    {closed !== undefined && <span className="text-neutral-600 dark:text-neutral-300">{t(closed ? 'closed' : 'open')}</span>}
  </div>;
}
