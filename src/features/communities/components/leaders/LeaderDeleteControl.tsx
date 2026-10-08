'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import type { ActionResult } from '../../actions/_shared';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { PlanFeedback } from '../plans/PlanFeedback';

export function LeaderDeleteControl({ id, name, remove, onDeleted }: {
  id: string; name: string; remove: () => Promise<ActionResult<{ id: string }>>; onDeleted?: () => void;
}) {
  const t = useTranslations('communities.leaders');
  const editorId = `delete:${id}`;
  const interaction = usePlanInteraction();
  const opener = useEditorReturnFocus(editorId);
  const mutation = usePlanMutation(editorId);
  return interaction.editor === editorId ? <div className="my-3 space-y-3">
    <p className="text-sm">{t('deleteConfirm', { name })}</p>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('deleteHint')}</p>
    <div className="flex flex-wrap gap-2">
      <Button autoFocus color="red" disabled={mutation.blocked} onClick={() => mutation.run(remove, () => { interaction.endEdit(); onDeleted?.(); })}>{t('confirmDelete')}</Button>
      <Button outline disabled={mutation.blocked} onClick={interaction.endEdit}>{t('cancel')}</Button>
    </div><PlanFeedback {...mutation} />
  </div> : <Button ref={opener} plain disabled={mutation.blocked} onClick={() => interaction.beginEdit(editorId)}
    aria-label={t('deleteNamed', { name })}>{t('delete')}</Button>;
}
