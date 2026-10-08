import { useTranslations } from 'next-intl';
import { eventStatus } from '../../lib/event-dates';
import type { CommunityEvent } from '../../types/communityEvent.types';
export function EventStatus({ event, now }: { event: CommunityEvent; now: string }) {
  const t = useTranslations('communities.events');
  const status = eventStatus(event, now);
  return <div className="flex flex-wrap gap-2 text-xs font-medium">
    {!event.is_published && <span className="rounded bg-secondary-100 px-2 py-1 text-secondary-900 dark:bg-primary-900 dark:text-secondary-300">{t('draft')}</span>}
    <span className={status === 'cancelled' ? 'text-red-700 dark:text-red-300' : 'text-primary-800 dark:text-primary-300'}>{t(`status.${status}`)}</span>
  </div>;
}
