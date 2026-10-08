'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import Select from '@/ui/Select';
import { useLibraryPage } from '../../hooks/useLibraryPage';
import { loadCommunityQuestions } from '../../actions/questions/read.actions';
import type { QuestionQuery } from '../../schemas/communityQuestion.schema';
import type { CommunityQuestion, QuestionPage, CategoryPage, QuestionCategory } from '../../types/communityQuestion.types';
import { QuestionCategorySelect } from './QuestionCategorySelect';
import { QuestionByline } from './QuestionByline';
import { QuestionStatus } from './QuestionStatus';
import { PlanFeedback } from '../plans/PlanFeedback';
export function QuestionsIndex({ slug, query, initial, categories, category, signedIn, canAnswer, canModerate }: {
  slug: string; query: QuestionQuery; initial: QuestionPage<CommunityQuestion>; categories: CategoryPage;
  category: QuestionCategory | null; signedIn: boolean; canAnswer: boolean; canModerate: boolean;
}) {
  const t = useTranslations('communities.questions'); const router = useRouter();
  const [categoryId, setCategoryId] = useState(query.categoryId === undefined ? '*' : query.categoryId ?? '');
  const page = useLibraryPage(initial, (cursor) => loadCommunityQuestions({ ...query, cursor }), t('loadError'));
  const base = `/feed/comunidades/${slug}/preguntas`;
  return <section className="space-y-5 rounded-xl bg-white p-4 text-neutral-900 sm:p-5 dark:bg-neutral-800 dark:text-white">
    <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-xl font-semibold">{t('title')}</h2>
      {signedIn && <Button href={`${base}/nueva`} color="brand">{t('ask')}</Button>}
    </div>
    {!signedIn && <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('signIn')}</p>}
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault(); const data = new FormData(e.currentTarget); const params = new URLSearchParams();
      for (const field of ['search', 'view', 'state']) { const value = String(data.get(field) ?? '').trim(); if (value) params.set(field, value); }
      if (categoryId !== '*') params.set('category', categoryId || 'none');
      router.push(`${base}?${params.toString()}` as Route);
    }}>
      <label className="block text-sm font-medium">{t('search')}<Input type="search" name="search" maxLength={160} defaultValue={query.search} className="mt-1" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><QuestionCategorySelect communityId={query.communityId} initial={categories} selected={category} value={categoryId} onChange={setCategoryId} includeAll />
        <label className="text-sm font-medium">{t('show')}<Select name="view" defaultValue={query.view} className="mt-1"><option value="all">{t('all')}</option>
          <option value="faq">{t('faq')}</option>{signedIn && <option value="mine">{t('mine')}</option>}{canModerate && <option value="moderation">{t('moderation')}</option>}
        </Select></label>
        <label className="text-sm font-medium">{t('state')}<Select name="state" defaultValue={query.state} className="mt-1">
          <option value="all">{t('allStates')}</option><option value="open">{t('open')}</option><option value="closed">{t('closed')}</option>
        </Select></label>
        <div className="flex flex-wrap items-end gap-2"><Button type="submit" color="brand">{t('searchButton')}</Button><Button type="reset" outline onClick={() => { setCategoryId('*'); router.push(base as Route); }}>{t('clearFilters')}</Button></div>
      </div>
    </form>
    {canAnswer && <Button plain href={`${base}/categorias`}>{t('manageCategories')}</Button>}
    {!page.items.length && <p className="py-4 text-sm text-neutral-600 dark:text-neutral-300">{t('empty')}</p>}
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">{page.items.map((question) => <li key={question.id} className="space-y-2 py-4">
      <QuestionStatus isPublished={question.is_published} closed={question.is_closed} faq={question.is_faq} hidden={!!question.hidden_at} />
      <h3 className="wrap-anywhere font-semibold"><Link href={`${base}/${question.id}` as Route} className="text-primary-800 underline-offset-4 hover:underline dark:text-primary-300">{question.title}</Link></h3>
      <p className="line-clamp-2 whitespace-pre-line wrap-anywhere text-sm">{question.body}</p>
      <QuestionByline author={question.author_name} createdAt={question.created_at} />
    </li>)}</ul>
    {page.nextCursor && <Button outline disabled={page.pending} onClick={page.loadMore}>{t(page.pending ? 'loading' : 'moreQuestions')}</Button>}
    <PlanFeedback error={page.error} />
  </section>;
}
