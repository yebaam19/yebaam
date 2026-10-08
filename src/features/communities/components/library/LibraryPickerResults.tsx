'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { loadLibraryAssets } from '../../actions/library/queries.actions';
import type { ActionResult } from '../../actions/_shared';
import { useLibraryPage } from '../../hooks/useLibraryPage';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { AssetKind, LibraryPage } from '../../types/communityLibrary.types';
import { PlanFeedback } from '../plans/PlanFeedback';

type Props = {
  communityId: string; kind: AssetKind; search: string;
  attach: (id: string, assetId: string) => Promise<ActionResult<{ id: string }>>;
  editorId: string; attachedIds: string[]; onAttached: () => void;
};

export function LibraryPickerResults(props: Props) {
  const t = useTranslations('communities.attachments');
  const [initial, setInitial] = useState<LibraryPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { communityId, kind, search } = props;
  useEffect(() => {
    let current = true;
    loadLibraryAssets({ communityId, kind, search }).then((result) => {
      if (!current) return;
      if (result.ok) setInitial(result.data); else setError(result.error);
    }).catch(() => { if (current) setError(t('loadError')); });
    return () => { current = false; };
  }, [communityId, kind, search, attempt, t]);
  if (initial) return <ResultsPage {...props} initial={initial} />;
  return error ? <div><PlanFeedback error={error} /><Button outline onClick={() => {
    setError(null); setAttempt((value) => value + 1);
  }}>{t('retry')}</Button></div> : <p role="status" className="py-3 text-sm">{t('loading')}</p>;
}

function ResultsPage({ communityId, attach, kind, search, editorId, attachedIds, onAttached, initial }: Props & { initial: LibraryPage }) {
  const t = useTranslations('communities.attachments');
  const library = useTranslations('communities.library');
  const mutation = usePlanMutation(editorId);
  const ids = useRef(new Map<string, string>());
  const page = useLibraryPage(initial, (cursor) => loadLibraryAssets({ communityId, kind, search, cursor }));
  return <div>
    {!page.items.length && <p className="py-3 text-sm text-gray-600 dark:text-gray-300">{t('empty')}</p>}
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {page.items.map((asset) => <li key={asset.id} className="flex min-w-0 flex-wrap items-center gap-2 py-2">
        <div className="min-w-0 flex-1 basis-40">
          <p className="wrap-anywhere text-sm font-medium">{asset.title}</p>
          <p className="wrap-anywhere text-xs text-gray-600 dark:text-gray-400">{asset.original_name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {!asset.is_published && <span className="text-amber-800 dark:text-amber-300">{library('draft')} · </span>}{library(`audience.${asset.visibility}`)}
          </p>
        </div>
        <Button outline disabled={mutation.blocked || attachedIds.includes(asset.id)}
          aria-label={t(attachedIds.includes(asset.id) ? 'attachedNamed' : 'attachNamed', { title: asset.title })}
          onClick={() => {
            const id = ids.current.get(asset.id) ?? crypto.randomUUID();
            ids.current.set(asset.id, id);
            mutation.run(() => attach(id, asset.id), onAttached);
          }}>{t(attachedIds.includes(asset.id) ? 'attached' : 'attach')}</Button>
      </li>)}
    </ul>
    {page.nextCursor && <Button outline disabled={page.pending || mutation.blocked} onClick={page.loadMore}>{t(page.pending ? 'loading' : 'moreFiles')}</Button>}
    <PlanFeedback error={mutation.error ?? page.error} status={mutation.status} />
  </div>;
}
