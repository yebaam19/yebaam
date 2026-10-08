'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { imageUrl } from '@/lib/media/urls';
import { safeExternalHref } from '@/lib/safe-href';
import type { CommunityEvent } from '../../types/communityEvent.types';
import { eventStatus, formatEventDate } from '../../lib/event-dates';
import { useEventNow } from '../../hooks/useEventNow';
import { EventStatus } from './EventStatus';
import { EventActions } from './EventActions';
import { EventAttendance } from './EventAttendance';
export function EventDetail({ event, slug, canManage, attendance, initialNow }: {
  event: CommunityEvent; slug: string; canManage: boolean; attendance: { signedIn: boolean; attending: boolean }; initialNow: string;
}) {
  const t = useTranslations('communities.events'); const locale = useLocale(); const now = useEventNow(initialNow);
  const [shareMessage, setShareMessage] = useState(''); const status = eventStatus(event, now);
  const virtual = safeExternalHref(event.virtual_url); const registration = safeExternalHref(event.registration_url);
  return <article className="space-y-5 rounded-xl bg-white p-4 text-neutral-900 sm:p-5 dark:bg-neutral-800 dark:text-white">
    <Button plain href={`/feed/comunidades/${slug}/eventos`}>{t('allEvents')}</Button>
    {event.cover && <img src={imageUrl(event.cover.media_id)} alt={event.cover.title} className="aspect-video w-full rounded-lg object-contain" />}
    <EventStatus event={event} now={now} />
    <h2 className="wrap-anywhere text-2xl font-semibold">{event.title}</h2>
    <dl className="space-y-3 text-sm">
      <div><dt className="font-semibold">{t('startsAt')}</dt><dd>{formatEventDate(event.starts_at, locale)}</dd></div>
      <div><dt className="font-semibold">{t('endsAt')}</dt><dd>{formatEventDate(event.ends_at, locale)}</dd></div>
      <div><dt className="font-semibold">{t('organizer')}</dt><dd className="wrap-anywhere">{event.organizer}</dd></div>
      {event.location && <div><dt className="font-semibold">{t('location')}</dt><dd className="whitespace-pre-line wrap-anywhere">{event.location}</dd></div>}
    </dl>
    <p className="text-xs text-neutral-600 dark:text-neutral-300">{t('timezone')}</p>
    {virtual && <a href={virtual} target="_blank" rel="noreferrer" className="inline-block text-sm text-primary-800 underline dark:text-primary-300">{t('openVirtual')}</a>}
    {event.description && <p className="whitespace-pre-line wrap-anywhere text-sm leading-relaxed">{event.description}</p>}
    {(event.registration_info || registration) && <section className="space-y-2"><h3 className="font-semibold">{t('registration')}</h3>
      <p className="whitespace-pre-line wrap-anywhere text-sm">{event.registration_info}</p>
      {registration && <a href={registration} target="_blank" rel="noreferrer" className="inline-block text-sm text-primary-800 underline dark:text-primary-300">{t('openRegistration')}</a>}
    </section>}
    {event.is_published && <EventAttendance key={`${event.id}:${attendance.attending}`} eventId={event.id} signedIn={attendance.signedIn} initialAttending={attendance.attending}
      allowed={event.rsvp_enabled && status !== 'finished' && status !== 'cancelled'} />}
    <Button outline onClick={async () => {
      try {
        const url = new URL(`/feed/comunidades/${slug}/eventos/${event.id}`, window.location.origin).href;
        if (navigator.share) await navigator.share({ title: event.title, url });
        else { await navigator.clipboard.writeText(url); setShareMessage(t('copied')); }
      } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) setShareMessage(t('shareError')); }
    }}>{t('share')}</Button>
    <p role="status" className="text-sm text-neutral-600 dark:text-neutral-300">{shareMessage}</p>
    {canManage && <EventActions event={event} slug={slug} />}
  </article>;
}
