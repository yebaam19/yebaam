'use client';
import { useLocale, useTranslations } from 'next-intl';
export function QuestionByline({ author, createdAt }: { author: string | null; createdAt: string }) {
  const locale = useLocale(); const t = useTranslations('communities.questions');
  return <p className="wrap-anywhere text-xs text-neutral-600 dark:text-neutral-300">{author ?? t('unknownAuthor')} · <time dateTime={createdAt}>
    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'America/Bogota' }).format(new Date(createdAt))}
  </time></p>;
}
