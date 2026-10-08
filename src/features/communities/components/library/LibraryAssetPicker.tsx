'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import Select from '@/ui/Select';
import type { AssetKind } from '../../types/communityLibrary.types';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import type { ActionResult } from '../../actions/_shared';
import { LibraryPickerResults } from './LibraryPickerResults';
const DEFAULT_KINDS: AssetKind[] = ['document', 'image', 'video'];

export function LibraryAssetPicker({ communityId, editorId, attachedIds, onClose, attach, kinds = DEFAULT_KINDS }: {
  communityId: string; kinds?: AssetKind[];
  attach: (id: string, assetId: string) => Promise<ActionResult<{ id: string }>>; editorId: string; attachedIds: string[]; onClose: () => void;
}) {
  const t = useTranslations('communities.attachments');
  const interaction = usePlanInteraction();
  const [kind, setKind] = useState<AssetKind>(kinds[0]);
  const [search, setSearch] = useState('');
  return <div className="my-3 space-y-3 rounded-lg bg-neutral-50 p-3 sm:p-4 dark:bg-neutral-900">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-sm font-semibold">{t('choose')}</h4>
      <Button outline disabled={interaction.busy} onClick={onClose}>{t('cancel')}</Button>
    </div>
    <p className="max-w-prose text-sm text-neutral-600 dark:text-neutral-300">{t('privacyHint')}</p>
    <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
      event.preventDefault(); setSearch(String(new FormData(event.currentTarget).get('search') ?? '').trim());
    }}>
      <label className="min-w-36 text-sm">{t('type')}
        <Select value={kind} disabled={interaction.busy} onChange={(event) => setKind(event.target.value as AssetKind)}>
          {kinds.map((value) => <option key={value} value={value}>{t(`kinds.${value}`)}</option>)}
        </Select>
      </label>
      <label className="min-w-36 flex-1 text-sm">{t('searchLabel')}
        <Input autoFocus name="search" maxLength={100} disabled={interaction.busy} placeholder={t('searchPlaceholder')} />
      </label>
      <Button type="submit" outline disabled={interaction.busy}>{t('search')}</Button>
    </form>
    <LibraryPickerResults key={`${kind}:${search}`} communityId={communityId} attach={attach}
      editorId={editorId} kind={kind} search={search} attachedIds={attachedIds} onAttached={onClose} />
  </div>;
}
