'use client';
import { useLocale, useTranslations } from 'next-intl';
import { eventOccursOn } from '../../lib/event-dates';
import type { CommunityEvent } from '../../types/communityEvent.types';
export function EventCalendar({ month, events, selected, onSelect }: {
  month: string; events: CommunityEvent[]; selected: string | null; onSelect: (day: string) => void;
}) {
  const t = useTranslations('communities.events'); const locale = useLocale();
  const [year, number] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, number - 1, 1)).getUTCDay() + 6) % 7;
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  return <div className="grid grid-cols-7 gap-1" aria-label={t('calendar')}>
    {Array.from({ length: 7 }, (_, i) => <span key={`w${i}`} className="py-2 text-center text-xs text-neutral-600 dark:text-neutral-300">{weekday.format(new Date(Date.UTC(2026, 0, 5 + i)))}</span>)}
    {Array.from({ length: offset }, (_, i) => <span key={`blank${i}`} />)}
    {Array.from({ length: days }, (_, i) => {
      const day = `${month}-${String(i + 1).padStart(2, '0')}`;
      const count = events.filter((event) => eventOccursOn(event, day)).length;
      return <button key={day} type="button" aria-label={t('dayLabel', { day, count })} aria-pressed={selected === day} onClick={() => onSelect(day)}
        className={`flex min-h-14 flex-col items-center justify-center rounded-lg border text-sm focus-visible:outline-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 ${selected === day
          ? 'border-primary-800 bg-primary-800 text-white' : 'border-neutral-200 hover:bg-primary-50 dark:border-neutral-700 dark:hover:bg-neutral-800'}`}>
        <span className="font-medium tabular-nums">{i + 1}</span>{count > 0 && <span className="text-xs">{count} ·</span>}
      </button>;
    })}
  </div>;
}
