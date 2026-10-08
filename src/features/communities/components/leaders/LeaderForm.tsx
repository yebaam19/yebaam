'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import Select from '@/ui/Select';
import { saveCommunityLeader } from '../../actions/leaders/content.actions';
import { leaderInputSchema } from '../../schemas/communityLeader.schema';
import type { CommunityLeader, LeaderCategory } from '../../types/communityLeader.types';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { PlanFeedback } from '../plans/PlanFeedback';
const TextEditor = dynamic(() => import('../plans/PlanTextEditor').then((m) => m.PlanTextEditor), { ssr: false });

export function LeaderForm({ communityId, sectionId, leader, categories, editorId, onClose }: {
  communityId: string; sectionId: string; leader?: CommunityLeader; categories: LeaderCategory[]; editorId: string; onClose: () => void;
}) {
  const t = useTranslations('communities.leaders');
  const mutation = usePlanMutation(editorId);
  const [id] = useState(() => leader?.id ?? crypto.randomUUID());
  const [field, setField] = useState<'biography' | 'trajectory'>('biography');
  const [text, setText] = useState({ biography: leader?.biography ?? '', trajectory: leader?.trajectory ?? '' });
  const [error, setError] = useState<string | null>(null);
  return <form className="mt-5 space-y-4" onSubmit={(event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const parsed = leaderInputSchema.safeParse({ communityId, sectionId, id, ...text, expectedVersion: leader?.version,
      fullName: form.get('fullName'), responsibility: form.get('responsibility'), categoryId: form.get('categoryId') || null,
      position: Number(form.get('position')), isPublished: form.get('published') === 'on' });
    if (!parsed.success) { setError(t('invalid')); return; }
    setError(null); mutation.run(() => saveCommunityLeader(parsed.data), onClose);
  }}>
    <fieldset disabled={mutation.blocked} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">{t('name')}<Input autoFocus name="fullName" required maxLength={160} defaultValue={leader?.full_name} className="mt-2" /></label>
        <label className="text-sm font-medium">{t('responsibility')}<Input name="responsibility" maxLength={200} defaultValue={leader?.responsibility} className="mt-2" /></label>
        <label className="text-sm font-medium">{t('category')}<Select name="categoryId" defaultValue={leader?.category_id ?? ''} className="mt-2">
          <option value="">{t('uncategorized')}</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.title}{!item.is_published ? ` · ${t('draft')}` : ''}</option>)}
        </Select></label>
        <label className="text-sm font-medium">{t('position')}<Input name="position" type="number" min={0} max={2147483647} required defaultValue={leader?.position ?? 0} className="mt-2" /></label>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('positionHint')}</p>
      <div><label className="block text-sm font-medium">{t('textSection')}
        <Select value={field} onChange={(event) => setField(event.target.value as typeof field)} className="mt-2">
          <option value="biography">{t('biography')}</option><option value="trajectory">{t('trajectory')}</option>
        </Select></label>
        <TextEditor key={field} label={t(field)} content={text[field]} disabled={mutation.blocked}
          onChange={(html) => setText((previous) => ({ ...previous, [field]: html }))} />
      </div>
      <label className="flex items-start gap-3 text-sm"><input name="published" type="checkbox" defaultChecked={leader?.is_published ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800 dark:text-primary-400" />
        <span>{t('publish')}<span className="mt-1 block text-neutral-600 dark:text-neutral-300">{t('publishHint')}</span></span></label>
      <div className="flex flex-wrap gap-2"><Button type="submit" color="brand">{t(mutation.pending ? 'saving' : 'save')}</Button>
        <Button type="button" outline onClick={onClose}>{t('cancel')}</Button></div>
    </fieldset><PlanFeedback error={error ?? mutation.error} status={mutation.status} />
  </form>;
}
