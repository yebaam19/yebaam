'use client';
import { useState, type MouseEvent, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { loadQuestionCategories } from '../../actions/questions/read.actions';
import { saveQuestionCategory } from '../../actions/questions/write.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { PlanInteractionProvider, usePlanInteraction } from '../plans/PlanInteractionProvider';
import { PlanFeedback } from '../plans/PlanFeedback';
import type { CategoryPage, QuestionCategory } from '../../types/communityQuestion.types';
import { QuestionRemoval } from './QuestionRemoval';
import { QuestionCategoryForm } from './QuestionCategoryForm';
type Props = { communityId: string; slug: string; initial: CategoryPage };
export function QuestionCategories(props: Props) { return <PlanInteractionProvider><Categories {...props} /></PlanInteractionProvider>; }
function Categories({ communityId, slug, initial }: Props) {
  const t = useTranslations('communities.questions'); const router = useRouter(); const interaction = usePlanInteraction();
  const [editing, setEditing] = useState<QuestionCategory>(); const openerRef = useEditorReturnFocus('category-form');
  const locked = interaction.busy || !!interaction.editor;
  return <section className="space-y-5 rounded-xl bg-white p-4 text-neutral-900 sm:p-5 dark:bg-neutral-800 dark:text-white">
    <Button plain disabled={locked} onClick={() => router.push(`/feed/comunidades/${slug}/preguntas` as Route)}>{t('back')}</Button>
    <h2 className="text-xl font-semibold">{t('manageCategories')}</h2>
    <Button ref={editing ? undefined : openerRef} color="brand" disabled={locked} onClick={(e: MouseEvent<HTMLButtonElement>) => {
      openerRef.current = e.currentTarget; setEditing(undefined); interaction.beginEdit('category-form');
    }}>{t('addCategory')}</Button>
    {interaction.editor === 'category-form' && <QuestionCategoryForm key={editing?.id ?? 'new'} communityId={communityId} category={editing} onClose={interaction.endEdit} />}
    <CategoryRows key={JSON.stringify(initial)} communityId={communityId} initial={initial} editingId={editing?.id} openerRef={openerRef} onEdit={(category, button) => {
      openerRef.current = button; setEditing(category); interaction.beginEdit('category-form');
    }} />
  </section>;
}
function CategoryRows({ communityId, initial, onEdit, editingId, openerRef }: { communityId: string; initial: CategoryPage; editingId?: string; openerRef: RefObject<HTMLButtonElement | null>; onEdit: (item: QuestionCategory, openerRef: HTMLButtonElement) => void }) {
  const t = useTranslations('communities.questions'); const interaction = usePlanInteraction();
  const page = usePlanPage(initial, (cursor) => loadQuestionCategories({ communityId, cursor }));
  return <div className="space-y-3">
    {!page.items.length && <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('noCategories')}</p>}
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">{page.items.map((category) => <li key={category.id} className="space-y-2 py-3">
      <p className="wrap-anywhere text-sm font-medium">{category.title} {!category.is_published && <span className="text-secondary-900 dark:text-secondary-300">· {t('private')}</span>}</p>
      <div className="flex flex-wrap gap-2"><Button ref={editingId === category.id ? openerRef : undefined} outline disabled={interaction.busy || !!interaction.editor} aria-label={t('editNamed', { name: category.title })}
        onClick={(e: MouseEvent<HTMLButtonElement>) => onEdit(category, e.currentTarget)}>{t('edit')}</Button>
        <QuestionRemoval id={category.id} mode="archive" action={() => saveQuestionCategory({ communityId, id: category.id, expectedVersion: category.version,
          title: category.title, position: category.position, isPublished: category.is_published, archive: true, confirmed: true })} />
      </div>
    </li>)}</ul>
    {page.nextCursor && <Button outline disabled={page.pending || interaction.busy || !!interaction.editor} onClick={page.loadMore}>{t(page.pending ? 'loading' : 'moreCategories')}</Button>}
    <PlanFeedback error={page.error} />
  </div>;
}
