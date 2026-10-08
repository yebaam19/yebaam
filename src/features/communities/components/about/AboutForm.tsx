'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Select from '@/ui/Select';
import { ABOUT_TEXT_FIELDS, type AboutTextField, type CommunityAbout } from '../../types/communityAbout.types';
import { aboutInputSchema } from '../../schemas/communityAbout.schema';
import { saveCommunityAbout } from '../../actions/about/content.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { PlanFeedback } from '../plans/PlanFeedback';
import { AboutContactFields } from './AboutContactFields';
import { AboutSocialFields } from './AboutSocialFields';

const TextEditor = dynamic(() => import('../plans/PlanTextEditor').then((module) => module.PlanTextEditor), { ssr: false });

export function AboutForm({ communityId, sectionId, about, name, editorId, onClose }: {
  communityId: string; sectionId: string; about: CommunityAbout | null; name: string; editorId: string; onClose: () => void;
}) {
  const t = useTranslations('communities.about');
  const mutation = usePlanMutation(editorId);
  const [field, setField] = useState<AboutTextField>('description');
  const [content, setContent] = useState(() => Object.fromEntries(ABOUT_TEXT_FIELDS.map((key) => [key, about?.[key] ?? ''])) as Record<AboutTextField, string>);
  const [links, setLinks] = useState(about?.social_links ?? []);
  const [error, setError] = useState<string | null>(null);
  function save(form: FormData) {
    const parsed = aboutInputSchema.safeParse({
      communityId, id: sectionId, ...content, expectedVersion: about?.version,
      foundedOn: form.get('foundedOn') || null, location: form.get('location'),
      contactEmail: String(form.get('contactEmail') ?? '').trim(), contactPhone: form.get('contactPhone'),
      website: form.get('website'), socialLinks: links, isPublished: form.get('published') === 'on',
    });
    if (!parsed.success) { setError(t('invalidFields')); return; }
    setError(null);
    mutation.run(() => saveCommunityAbout(parsed.data), onClose);
  }
  return <form onSubmit={(event) => { event.preventDefault(); save(new FormData(event.currentTarget)); }} className="mt-5 space-y-4">
    <fieldset disabled={mutation.blocked} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">{t('editSection')}
          <Select autoFocus value={field} onChange={(event) => setField(event.target.value as AboutTextField)} className="mt-2">
            {ABOUT_TEXT_FIELDS.map((key) => <option key={key} value={key}>{t(`fields.${key}`)}</option>)}
          </Select>
        </label>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{t('editorHint')}</p>
        <TextEditor key={field} content={content[field]} label={t(`fields.${field}`)} disabled={mutation.blocked}
          onChange={(html) => setContent((previous) => ({ ...previous, [field]: html }))} />
      </div>
      <AboutContactFields about={about} name={name} />
      <AboutSocialFields links={links} onChange={setLinks} />
      <label className="flex items-start gap-3 text-sm">
        <input name="published" type="checkbox" defaultChecked={about?.is_published ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800 dark:text-primary-400" />
        <span>{t('publish')}<span className="mt-1 block text-neutral-600 dark:text-neutral-300">{t('publishHint')}</span></span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" color="brand">{t(mutation.pending ? 'saving' : 'save')}</Button>
        <Button type="button" outline onClick={onClose}>{t('cancel')}</Button>
      </div>
    </fieldset>
    <PlanFeedback error={error ?? mutation.error} status={mutation.status} />
  </form>;
}
