'use client';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import type { ActionResult } from '../../actions/_shared';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { PlanFeedback } from '../plans/PlanFeedback';
import { QuestionTextField } from './QuestionTextField';
export function QuestionRemoval({ id, mode, action, onSuccess }: {
  id: string; mode: 'hide' | 'archive'; action: (reason: string) => Promise<ActionResult<{ id: string }>>; onSuccess?: () => void;
}) {
  const t = useTranslations('communities.questions'); const interaction = usePlanInteraction();
  const editorId = `${mode}:${id}`; const opener = useEditorReturnFocus(editorId); const mutation = usePlanMutation(editorId);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (interaction.editor === editorId && mode === 'archive') cancel.current?.focus(); }, [interaction.editor, editorId, mode]);
  return <div>
    <Button ref={opener} plain disabled={mutation.blocked || interaction.editor === editorId} onClick={() => interaction.beginEdit(editorId)}>{t(mode)}</Button>
    {interaction.editor === editorId && <form className="mt-3 space-y-3" onSubmit={(e) => {
      e.preventDefault(); const reason = String(new FormData(e.currentTarget).get('reason') ?? '');
      mutation.run(() => action(reason), () => { interaction.endEdit(); onSuccess?.(); });
    }}><fieldset disabled={mutation.blocked} className="space-y-3">
      <p className="text-sm">{t(mode === 'hide' ? 'hideConfirm' : 'archiveConfirm')}</p>
      {mode === 'hide' && <QuestionTextField autoFocus label={t('reason')} name="reason" required maxLength={1000} rows={3} />}
      <div className="flex flex-wrap gap-2"><Button type="submit" color="brand">{t(mutation.pending ? 'saving' : 'confirm')}</Button>
        <Button ref={cancel} outline onClick={interaction.endEdit}>{t('cancel')}</Button></div>
    </fieldset><PlanFeedback {...mutation} /></form>}
  </div>;
}
