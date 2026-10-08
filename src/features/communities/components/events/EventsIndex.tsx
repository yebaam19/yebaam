'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Route } from 'next';
import Link from 'next/link';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import { eventOccursOn, formatEventDate } from '../../lib/event-dates';
import { useEventNow } from '../../hooks/useEventNow';
import { loadCommunityEvents } from '../../actions/events/read-attendance.actions';
import type { EventPage } from '../../types/communityEvent.types';
import { EventCalendar } from './EventCalendar';
import { EventStatus } from './EventStatus';
import { PlanFeedback } from '../plans/PlanFeedback';
export function EventsIndex({ communityId, slug, initial, month, initialView, canManage, initialNow }: {
  communityId: string; slug: string; initial: EventPage; month: string; initialView: 'list' | 'calendar'; canManage: boolean; initialNow: string;
}) {
  const t = useTranslations('communities.events'); const locale = useLocale(); const router = useRouter();
  const now = useEventNow(initialNow);
  const [view, setView] = useState(initialView); const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(initial); const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const base = `/feed/comunidades/${slug}/eventos`;
  const events = selected && view === 'calendar' ? page.items.filter((event) => eventOccursOn(event, selected)) : page.items;
  return <section className="space-y-5 rounded-xl bg-white p-4 text-neutral-900 sm:p-5 dark:bg-neutral-800 dark:text-white">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{t('title')}</h2><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{t('timezone')}</p></div>
      {canManage && <Button color="brand" href={`${base}/nuevo`}>{t('create')}</Button>}
    </div>
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
      e.preventDefault(); const value = String(new FormData(e.currentTarget).get('month'));
      router.push(`${base}?month=${value}&view=${view}` as Route);
    }}><label className="min-w-40 flex-1 text-sm">{t('month')}<Input type="month" name="month" required min="2000-01" max="2099-12" defaultValue={month} /></label><Button outline type="submit">{t('show')}</Button></form>
    <div className="flex flex-wrap gap-2">
      <Button {...(view === 'list' ? { color: 'brand' as const } : { outline: true })} aria-pressed={view === 'list'} onClick={() => setView('list')}>{t('list')}</Button>
      <Button {...(view === 'calendar' ? { color: 'brand' as const } : { outline: true })} aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>{t('calendar')}</Button>
    </div>
    {view === 'calendar' && <><EventCalendar month={month} events={page.items} selected={selected} onSelect={setSelected} />
      {selected && <Button plain onClick={() => setSelected(null)}>{t('wholeMonth')}</Button>}</>}
    {page.nextCursor && <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('partial')}</p>}
    {!events.length && <p className="py-5 text-sm text-neutral-600 dark:text-neutral-300">{t(selected && view === 'calendar' ? 'emptyDay' : 'empty')}</p>}
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">{events.map((event) => <li key={event.id} className="space-y-2 py-4">
      <EventStatus event={event} now={now} />
      <h3 className="wrap-anywhere font-semibold"><Link href={`${base}/${event.id}` as Route} className="text-primary-800 underline-offset-4 hover:underline dark:text-primary-300">{event.title}</Link></h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{formatEventDate(event.starts_at, locale)}</p>
      <p className="wrap-anywhere text-sm">{event.location || t('virtual')}</p>
    </li>)}</ul>
    {page.nextCursor && <Button outline disabled={pending} onClick={() => {
      setError(null); startTransition(async () => {
        try {
        const result = await loadCommunityEvents({ communityId, month, cursor: page.nextCursor });
        if (!result.ok) { setError(result.error); return; }
        setPage((previous) => ({ items: [...previous.items, ...result.data.items.filter((item) => !previous.items.some((old) => old.id === item.id))], nextCursor: result.data.nextCursor }));
        } catch { setError(t('loadError')); }
      });
    }}>{t(pending ? 'loading' : 'more')}</Button>}
    <PlanFeedback error={error} />
  </section>;
}
