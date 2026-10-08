'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import { saveCommunityEvent } from '../../actions/events/write.actions';
import { eventSchema } from '../../schemas/communityEvent.schema';
import { localEventTime, toEventISO } from '../../lib/event-dates';
import type { CommunityEvent } from '../../types/communityEvent.types';
import { EventCoverField } from './EventCoverField';
import { PlanFeedback } from '../plans/PlanFeedback';
export function EventForm({ communityId, slug, initial, organizer }: {
  communityId: string; slug: string; initial: CommunityEvent | null; organizer: string;
}) {
  const t = useTranslations('communities.events'); const router = useRouter();
  const id = useRef(initial?.id ?? null);
  const [coverId, setCoverId] = useState(initial?.cover_asset_id ?? null);
  const [cover, setCover] = useState(initial?.cover ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null); const [pending, startTransition] = useTransition();
  const base = `/feed/comunidades/${slug}/eventos`;
  return <section className="space-y-5 rounded-xl bg-white p-4 text-neutral-900 sm:p-5 dark:bg-neutral-800 dark:text-white">
    <h2 className="text-xl font-semibold">{t(initial ? 'edit' : 'create')}</h2>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('timezone')}</p>
    <EventCoverField communityId={communityId} slug={slug} id={coverId} cover={cover} disabled={pending}
      onPickerChange={setPickerOpen} onChange={(id, asset) => { setCoverId(id); setCover(asset); }} />
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault(); const fields = new FormData(event.currentTarget);
      const text = (name: string) => String(fields.get(name) ?? '');
      if (!id.current) id.current = crypto.randomUUID();
      const value = { communityId, id: id.current, expectedVersion: initial?.version ?? 0,
        title: text('title'), description: text('description'), startsAt: toEventISO(text('startsAt')), endsAt: toEventISO(text('endsAt')),
        location: text('location'), virtualUrl: text('virtualUrl'), organizer: text('organizer'), registrationInfo: text('registrationInfo'),
        registrationUrl: text('registrationUrl'), coverAssetId: coverId, rsvpEnabled: fields.has('rsvpEnabled'), isPublished: fields.has('isPublished') };
      if (!eventSchema.safeParse(value).success) { setError(t('validation')); return; }
      setError(null); startTransition(async () => {
        try {
          const result = await saveCommunityEvent(value);
          if (!result.ok) { setError(result.error); return; }
          router.replace(`${base}/${result.data.id}` as Route); router.refresh();
        } catch { setError(t('saveError')); }
      });
    }}>
      <fieldset disabled={pending} className="space-y-4">
        <label className="block text-sm font-medium">{t('eventTitle')}<Input autoFocus name="title" required maxLength={180} defaultValue={initial?.title} /></label>
        <label className="block text-sm font-medium">{t('description')}<textarea name="description" rows={5} maxLength={10000} defaultValue={initial?.description}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm focus:border-primary-800 focus:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-medium">{t('startsAt')}<Input type="datetime-local" name="startsAt" required defaultValue={initial ? localEventTime(initial.starts_at) : ''} /></label>
          <label className="min-w-0 text-sm font-medium">{t('endsAt')}<Input type="datetime-local" name="endsAt" required defaultValue={initial ? localEventTime(initial.ends_at) : ''} /></label>
        </div>
        <label className="block text-sm font-medium">{t('location')}<Input name="location" maxLength={500} defaultValue={initial?.location} /></label>
        <label className="block text-sm font-medium">{t('virtualUrl')}<Input type="url" name="virtualUrl" maxLength={2000} placeholder="https://" defaultValue={initial?.virtual_url} /></label>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('placeHint')}</p>
        <label className="block text-sm font-medium">{t('organizer')}<Input name="organizer" required maxLength={180} defaultValue={initial?.organizer ?? organizer} /></label>
        <label className="block text-sm font-medium">{t('registrationInfo')}<textarea name="registrationInfo" rows={3} maxLength={2000} defaultValue={initial?.registration_info}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm focus:border-primary-800 focus:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900" /></label>
        <label className="block text-sm font-medium">{t('registrationUrl')}<Input type="url" name="registrationUrl" maxLength={2000} placeholder="https://" defaultValue={initial?.registration_url} /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="rsvpEnabled" defaultChecked={initial?.rsvp_enabled ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800" />{t('enableRsvp')}</label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked={initial?.is_published ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800" /><span>{t('publish')}<span className="mt-1 block text-neutral-600 dark:text-neutral-300">{t('publishHint')}</span></span></label>
      </fieldset>
      <PlanFeedback error={error} />
      <div className="flex flex-wrap gap-2"><Button type="submit" color="brand" disabled={pending || pickerOpen}>{t(pending ? 'saving' : 'save')}</Button>
        <Button outline disabled={pending} onClick={() => router.push((initial ? `${base}/${initial.id}` : base) as Route)}>{t('discard')}</Button></div>
    </form>
  </section>;
}
