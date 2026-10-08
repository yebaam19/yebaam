'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import type { LeaderContacts } from '../../types/communityLeader.types';
import { saveLeaderContacts } from '../../actions/leaders/details.actions';
import { leaderContactsSchema } from '../../schemas/communityLeader.schema';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { PlanFeedback } from '../plans/PlanFeedback';
import { AboutSocialFields } from '../about/AboutSocialFields';

type Props = { communityId: string; leaderId: string; contacts: LeaderContacts | null; canEdit: boolean };
export function LeaderContactsPanel(props: Props) {
  const { contacts, canEdit } = props;
  const t = useTranslations('communities.leaders');
  const interaction = usePlanInteraction();
  const opener = useEditorReturnFocus('leader-contacts');
  if (!contacts && !canEdit) return null;
  return <section className="mt-7 border-t border-neutral-200 pt-5 dark:border-neutral-700">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">{t('contacts')}</h3>
      {canEdit && <Button ref={opener} outline disabled={interaction.busy || !!interaction.editor} onClick={() => interaction.beginEdit('leader-contacts')}>{t('editContacts')}</Button>}</div>
    {interaction.editor === 'leader-contacts' ? <ContactsForm {...props} /> : <div className="mt-3 space-y-3 text-sm">
      {canEdit && !contacts?.is_public && <p className="text-secondary-900 dark:text-secondary-300">{t('privateContacts')}</p>}
      {contacts?.email && <p className="wrap-anywhere">{contacts.email}</p>}{contacts?.phone && <p className="wrap-anywhere">{contacts.phone}</p>}
      {contacts?.profile_username && <Link href={`/${encodeURIComponent(contacts.profile_username)}` as Route}
        className="inline-flex min-h-11 items-center text-primary-800 underline-offset-4 hover:underline focus-visible:outline-2 dark:text-primary-300">{t('platformProfile')}</Link>}
      {!!contacts?.social_links.length && <nav aria-label={t('socialLinks')} className="flex flex-wrap gap-x-5 gap-y-1">
        {contacts.social_links.map((link, index) => <a key={index} href={link.url} target="_blank" rel="noopener noreferrer nofollow"
          aria-label={t('external', { label: link.label })} className="inline-flex min-h-11 max-w-full items-center text-primary-800 underline-offset-4 wrap-anywhere hover:underline focus-visible:outline-2 dark:text-primary-300">{link.label}</a>)}
      </nav>}
    </div>}
  </section>;
}
function ContactsForm({ communityId, leaderId, contacts }: Props) {
  const t = useTranslations('communities.leaders');
  const interaction = usePlanInteraction();
  const mutation = usePlanMutation('leader-contacts');
  const [links, setLinks] = useState(contacts?.social_links ?? []);
  const [error, setError] = useState<string | null>(null);
  return <form className="mt-4 space-y-4" onSubmit={(event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const parsed = leaderContactsSchema.safeParse({ communityId, id: leaderId, expectedVersion: contacts?.version,
      email: String(form.get('email') ?? '').trim(), phone: form.get('phone'), socialLinks: links,
      profileUsername: form.get('profileUsername'), isPublic: form.get('public') === 'on' });
    if (!parsed.success) { setError(t('invalid')); return; }
    setError(null); mutation.run(() => saveLeaderContacts(parsed.data), interaction.endEdit);
  }}><fieldset disabled={mutation.blocked} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">{t('email')}<Input autoFocus name="email" type="email" maxLength={254} defaultValue={contacts?.email} className="mt-2" /></label>
      <label className="text-sm font-medium">{t('phone')}<Input name="phone" type="tel" maxLength={40} defaultValue={contacts?.phone} className="mt-2" /></label>
    </div>
    <label className="block text-sm font-medium">{t('profileUsername')}<Input name="profileUsername" maxLength={100} defaultValue={contacts?.profile_username ?? ''} className="mt-2" /></label>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('profileHint')}</p>
    <AboutSocialFields links={links} onChange={setLinks} />
    <label className="flex items-start gap-3 text-sm"><input name="public" type="checkbox" defaultChecked={contacts?.is_public ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800 dark:text-primary-400" />
      <span>{t('publishContacts')}<span className="mt-1 block text-neutral-600 dark:text-neutral-300">{t('contactsHint')}</span></span></label>
    <div className="flex flex-wrap gap-2"><Button type="submit" color="brand">{t(mutation.pending ? 'saving' : 'save')}</Button><Button type="button" outline onClick={interaction.endEdit}>{t('cancel')}</Button></div>
  </fieldset><PlanFeedback error={error ?? mutation.error} status={mutation.status} /></form>;
}
