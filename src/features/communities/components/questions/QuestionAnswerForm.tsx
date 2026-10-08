'use client';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { saveQuestionAnswer } from '../../actions/questions/write.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { QuestionAnswer } from '../../types/communityQuestion.types';
import { PlanFeedback } from '../plans/PlanFeedback';
import { QuestionTextField } from './QuestionTextField';
export function QuestionAnswerForm({ communityId, questionId, initial, editorId, onClose }: {
  communityId: string; questionId: string; initial?: QuestionAnswer; editorId: string; onClose: () => void;
}) {
  const t = useTranslations('communities.questions'); const mutation = usePlanMutation(editorId);
  const id = useRef(initial?.id ?? null);
  return <form className="mt-4 space-y-3" onSubmit={(e) => {
    e.preventDefault(); const fields = new FormData(e.currentTarget); id.current ??= crypto.randomUUID();
    mutation.run(() => saveQuestionAnswer({ communityId, questionId, id: id.current, expectedVersion: initial?.version ?? 0,
      body: fields.get('body'), isPublished: fields.has('published') }), onClose);
  }}><fieldset disabled={mutation.blocked} className="space-y-3">
    <QuestionTextField autoFocus name="body" label={t('answerBody')} required maxLength={10000} rows={6} defaultValue={initial?.body} />
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={initial?.is_published ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800" />
      <span>{t('publishAnswer')}<span className="mt-1 block text-neutral-600 dark:text-neutral-300">{t('answerHint')}</span></span></label>
    <div className="flex flex-wrap gap-2"><Button color="brand" type="submit">{t(mutation.pending ? 'saving' : 'saveAnswer')}</Button><Button outline onClick={onClose}>{t('cancel')}</Button></div>
  </fieldset><PlanFeedback {...mutation} /></form>;
}
