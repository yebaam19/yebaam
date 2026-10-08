'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import { importCommunityRules, saveCommunitySection } from '../../actions/plans/sections.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { CommunitySection, SectionKind } from '../../types/communityPlan.types';
import { PlanFeedback } from './PlanFeedback';
import { usePlanInteraction } from './PlanInteractionProvider';

export function PlanSectionSettings({ communityId, kind, section, hasLegacyRules = false }: {
  communityId: string; kind: SectionKind; section?: CommunitySection; hasLegacyRules?: boolean;
}) {
  const t = useTranslations('communities.plans');
  const editorId = `section:${section?.id ?? 'new'}`;
  const interaction = usePlanInteraction();
  const mutation = usePlanMutation(editorId);
  const [newId, setNewId] = useState<string>();

  function save(form: FormData) {
    const id = section?.id ?? newId ?? crypto.randomUUID();
    setNewId(id);
    mutation.run(() => saveCommunitySection({
      communityId, id, kind, title: form.get('title'),
      position: Number(form.get('position')), isVisible: form.get('visible') === 'on',
      expectedVersion: section?.version,
    }));
  }

  if (!section && hasLegacyRules) return (
    <div className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-700">
      <p className="mb-3 max-w-prose text-sm text-neutral-600 dark:text-neutral-300">{t('importHint')}</p>
      <Button color="brand" disabled={mutation.pending}
        onClick={() => mutation.run(() => importCommunityRules({ communityId }))}>
        {mutation.pending ? t('saving') : t('importRules')}
      </Button>
      <PlanFeedback {...mutation} />
    </div>
  );

  const form = (
    <form onSubmit={(event) => { event.preventDefault(); save(new FormData(event.currentTarget)); }} className="mt-4 space-y-4">
      <fieldset disabled={mutation.blocked} className="space-y-4">
        <label className="block text-sm font-medium">
          {t('tabTitle')}
          <Input name="title" required maxLength={120} defaultValue={section?.title ?? t(`titles.${kind}`)} className="mt-2" />
        </label>
        <label className="block max-w-48 text-sm font-medium">
          {t('tabPosition')}
          <Input name="position" type="number" min={0} max={2147483647} required
            defaultValue={section?.position ?? (kind === 'about' ? 0 : kind === 'government' ? 2 : kind === 'economy' ? 3 : kind === 'leaders' ? 4 : 1)} className="mt-2" />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="visible" defaultChecked={section?.is_visible ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800 dark:text-primary-400" />
          <span>{t('visible')}<span className="mt-1 block text-neutral-600 dark:text-neutral-300">{t('visibleHint')}</span></span>
        </label>
        <Button type="submit" color="brand">{mutation.pending ? t('saving') : section ? t('saveSettings') : t('createSection')}</Button>
      </fieldset>
      <PlanFeedback {...mutation} />
    </form>
  );

  return section ? (
    <details open={interaction.editor === editorId} className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-700">
      <summary aria-disabled={mutation.blocked || undefined} onClick={(event) => {
        event.preventDefault();
        if (mutation.blocked) return;
        if (interaction.editor === editorId) interaction.endEdit(); else interaction.beginEdit(editorId);
      }} className="cursor-pointer text-sm font-medium text-primary-800 dark:text-primary-300">{t('settings')}</summary>
      {form}
    </details>
  ) : form;
}
