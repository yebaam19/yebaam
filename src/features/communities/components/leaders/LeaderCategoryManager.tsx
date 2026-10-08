'use client';
import { useState, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import type { LeaderCategory } from '../../types/communityLeader.types';
import { saveLeaderCategory, deleteLeaderCategory } from '../../actions/leaders/content.actions';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { PlanFeedback } from '../plans/PlanFeedback';
import { LeaderDeleteControl } from './LeaderDeleteControl';

export function LeaderCategoryManager({ communityId, sectionId, categories }: {
  communityId: string; sectionId: string; categories: LeaderCategory[];
}) {
  const t = useTranslations('communities.leaders');
  const interaction = usePlanInteraction();
  const [category, setCategory] = useState<LeaderCategory>();
  const editorId = 'leader-category';
  const openerRef = useEditorReturnFocus(editorId);
  return <details className="my-5 border-y border-neutral-200 py-3 dark:border-neutral-700">
    <summary className="cursor-pointer py-2 text-sm font-medium text-primary-800 dark:text-primary-300">{t('manageCategories')}</summary>
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">{categories.map((item) => <li key={item.id} className="flex flex-wrap items-center gap-2 py-2">
      <span className="min-w-0 flex-1 basis-36 wrap-anywhere text-sm">{item.title}{!item.is_published && <span className="ml-2 text-secondary-900 dark:text-secondary-300">{t('draft')}</span>}</span>
      <Button outline disabled={interaction.busy || !!interaction.editor} aria-label={t('editNamed', { name: item.title })}
        onClick={(event: MouseEvent<HTMLButtonElement>) => { openerRef.current = event.currentTarget; setCategory(item); interaction.beginEdit(editorId); }}>{t('edit')}</Button>
      <LeaderDeleteControl id={item.id} name={item.title} remove={() => deleteLeaderCategory({ communityId, id: item.id, expectedVersion: item.version, confirmed: true })} />
    </li>)}</ul>
    {interaction.editor === editorId ? <CategoryForm key={category?.id ?? 'new'} communityId={communityId} sectionId={sectionId} category={category} editorId={editorId} />
      : <Button ref={category ? undefined : openerRef} outline className="mt-3" disabled={interaction.busy || !!interaction.editor} onClick={(event: MouseEvent<HTMLButtonElement>) => { openerRef.current = event.currentTarget; setCategory(undefined); interaction.beginEdit(editorId); }}>{t('addCategory')}</Button>}
  </details>;
}
function CategoryForm({ communityId, sectionId, category, editorId }: {
  communityId: string; sectionId: string; category?: LeaderCategory; editorId: string;
}) {
  const t = useTranslations('communities.leaders');
  const interaction = usePlanInteraction();
  const mutation = usePlanMutation(editorId);
  const [id] = useState(() => category?.id ?? crypto.randomUUID());
  return <form className="my-4 space-y-4" onSubmit={(event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    mutation.run(() => saveLeaderCategory({ communityId, sectionId, id, expectedVersion: category?.version,
      title: form.get('title'), position: Number(form.get('position')), isPublished: form.get('published') === 'on' }), interaction.endEdit);
  }}><fieldset disabled={mutation.blocked} className="space-y-4">
    <label className="block text-sm font-medium">{t('categoryName')}<Input autoFocus name="title" required maxLength={120} defaultValue={category?.title} className="mt-2" /></label>
    <label className="block max-w-48 text-sm font-medium">{t('position')}<Input name="position" type="number" min={0} max={2147483647} required defaultValue={category?.position ?? 0} className="mt-2" /></label>
    <label className="flex items-start gap-3 text-sm"><input name="published" type="checkbox" defaultChecked={category?.is_published ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800 dark:text-primary-400" /><span>{t('publishCategory')}</span></label>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('categoryHint')}</p>
    <div className="flex flex-wrap gap-2"><Button type="submit" color="brand">{t(mutation.pending ? 'saving' : 'save')}</Button><Button type="button" outline onClick={interaction.endEdit}>{t('cancel')}</Button></div>
  </fieldset><PlanFeedback {...mutation} /></form>;
}
