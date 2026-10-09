'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Input from '@/ui/Input';
import Textarea from '@/ui/Textarea';
import { Button } from '@/ui/Button';
import { savePlanItem } from '../../actions/plans/content.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { PlanAxis, PlanPoint } from '../../types/communityPlan.types';
import { axisPath } from '../../utils/plan-navigation';
import { PlanFeedback } from './PlanFeedback';

const PlanTextEditor = dynamic(() => import('./PlanTextEditor').then((module) => module.PlanTextEditor), { ssr: false });

export function PlanItemForm({ communityId, sectionId, kind, axisId, item, basePath, onClose, editorId, isRules = false }: {
  communityId: string; sectionId: string; kind: 'axis' | 'point'; axisId?: string;
  item?: PlanAxis | PlanPoint; basePath: string; onClose: () => void; editorId?: string; isRules?: boolean;
}) {
  const t = useTranslations('communities.plans');
  const router = useRouter();
  const mutation = usePlanMutation(editorId);
  const [newId, setNewId] = useState<string>();
  const [content, setContent] = useState(item && 'content' in item ? item.content : '');
  const [error, setError] = useState<string | null>(null);
  function save(form: FormData) {
    if (new TextEncoder().encode(content).byteLength > 200000) { setError(t('contentTooLong')); return; }
    const id = item?.id ?? newId ?? crypto.randomUUID();
    setNewId(id);
    setError(null);
    mutation.run(() => savePlanItem({
      communityId, sectionId, axisId, id, kind, title: form.get('title'),
      description: form.get('description'), content, isPublished: form.get('published') === 'on',
      expectedVersion: item?.version,
    }), () => {
      onClose();
      if (kind === 'axis' && !item) router.push(axisPath(basePath, id) as Route);
    });
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); save(new FormData(event.currentTarget)); }}
      className="my-4 space-y-4 rounded-xl border border-neutral-300 p-4 dark:border-neutral-600">
      <h3 className="text-lg font-semibold">{t(`${isRules ? 'rules.' : ''}${item ? 'edit' : 'new'}.${kind}`)}</h3>
      <fieldset disabled={mutation.blocked} className="space-y-4">
        <label className="block text-sm font-medium">{t('title')}
          <Input autoFocus name="title" required maxLength={200} defaultValue={item?.title ?? ''} className="mt-2" />
        </label>
        <label className="block text-sm font-medium">{t('description')}
          <Textarea name="description" maxLength={4000} defaultValue={item?.description ?? ''} className="mt-2" />
        </label>
        {kind === 'point' && <div><p className="text-sm font-medium">{t('content')}</p>
          <PlanTextEditor content={content} onChange={setContent} disabled={mutation.pending} />
        </div>}
        <label className="flex items-center gap-3 text-sm">
          <input name="published" type="checkbox" defaultChecked={item?.is_published ?? false} className="rounded text-primary-800 focus:ring-primary-800 dark:text-primary-400" />
          {t('publish')}
        </label>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t(isRules ? 'rules.publishHint' : 'publishHint')}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" color="brand">{mutation.pending ? t('saving') : t('save')}</Button>
          <Button type="button" outline onClick={onClose}>{t('cancel')}</Button>
        </div>
      </fieldset>
      <PlanFeedback error={error ?? mutation.error} status={mutation.status} />
    </form>
  );
}
