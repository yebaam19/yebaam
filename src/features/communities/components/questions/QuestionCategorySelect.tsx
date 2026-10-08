'use client';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Select from '@/ui/Select';
import { Button } from '@/ui/Button';
import { loadQuestionCategories } from '../../actions/questions/read.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import type { CategoryPage, QuestionCategory } from '../../types/communityQuestion.types';
import { PlanFeedback } from '../plans/PlanFeedback';
export function QuestionCategorySelect({ communityId, initial, selected, value, onChange, disabled, includeAll = false, focusOnMount = false }: {
  communityId: string; initial: CategoryPage; selected?: QuestionCategory | null; value: string;
  onChange: (value: string) => void; disabled?: boolean; includeAll?: boolean; focusOnMount?: boolean;
}) {
  const select = useRef<HTMLSelectElement>(null);
  useEffect(() => { if (focusOnMount) select.current?.focus(); }, [focusOnMount]);
  const t = useTranslations('communities.questions');
  const page = usePlanPage(initial, (cursor) => loadQuestionCategories({ communityId, cursor }));
  const options = selected && !page.items.some((item) => item.id === selected.id) ? [...page.items, selected] : page.items;
  return <div className="min-w-0 space-y-2">
    <label className="block text-sm font-medium">{t('category')}
      <Select ref={select} name="categoryId" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="mt-1">
        {includeAll && <option value="*">{t('allCategories')}</option>}
        <option value="">{t('uncategorized')}</option>
        {value && value !== '*' && !options.some((item) => item.id === value) && <option value={value}>{t('unavailableCategory')}</option>}
        {options.map((item) => <option key={item.id} value={item.id}>{item.title}{!item.is_published ? ` · ${t('private')}` : ''}</option>)}
      </Select>
    </label>
    {page.nextCursor && <Button plain disabled={disabled || page.pending} onClick={page.loadMore}>{t(page.pending ? 'loading' : 'moreCategories')}</Button>}
    <PlanFeedback error={page.error} />
  </div>;
}
