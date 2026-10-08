'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import type { ActionResult } from '../../actions/_shared';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { PlanFeedback } from '../plans/PlanFeedback';

export function LibraryUnlinkControl({ id, title, confirm, remove }: {
  id: string; title: string; confirm: string; remove: () => Promise<ActionResult<{ id: string }>>;
}) {
  const t = useTranslations('communities.attachments');
  const interaction = usePlanInteraction();
  const editorId = `detach:${id}`;
  const mutation = usePlanMutation(editorId);
  const opener = useEditorReturnFocus(editorId);
  const confirming = interaction.editor === editorId;
  function close() { interaction.endEdit(); }
  return <div className={confirming ? 'w-full' : ''}>
    <Button ref={opener} plain disabled={mutation.blocked || confirming}
      aria-label={t('removeNamed', { title: title })}
      onClick={() => interaction.beginEdit(editorId)}>{t('remove')}</Button>
    {confirming && <div className="my-2 space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
      <p className="text-sm">{confirm}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('keepFile')}</p>
      <div className="flex flex-wrap gap-2">
        <Button autoFocus color="blue" disabled={mutation.blocked} onClick={() => mutation.run(remove, close)}>{t(mutation.pending ? 'saving' : 'confirmRemove')}</Button>
        <Button outline disabled={mutation.blocked} onClick={close}>{t('cancel')}</Button>
      </div>
      <PlanFeedback {...mutation} />
    </div>}
  </div>;
}
