'use client';
import { useEffect, useRef, useState, useTransition, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowTopRightOnSquareIcon } from '@/components/icons/heroicons-shim';
import { Button } from '@/ui/Button';
import { saveCommunityShowcase } from '../../actions/showcase.actions';
import type { CommunityShowcase, ShowcaseVideo } from '../../types/communityShowcase.types';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';
import { PlanFeedback } from '../plans/PlanFeedback';
import { showcaseSchema } from '../../schemas/communityShowcase.schema';

export function ShowcaseEditor({ communityId, slug, initial, onClose }: {
  communityId: string; slug: string; initial: CommunityShowcase | null; onClose: () => void;
}) {
  const t = useTranslations('communities.showcase');
  const router = useRouter();
  const [introduction, setIntroduction] = useState(initial?.introduction ?? '');
  const [published, setPublished] = useState(initial?.is_published ?? false);
  const [videos, setVideos] = useState<ShowcaseVideo[]>(initial?.videos ?? []);
  const [picker, setPicker] = useState<number | null>(null);
  const [remove, setRemove] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pickerOpenerRef = useRef<HTMLButtonElement | null>(null);
  const editorTitleRef = useRef<HTMLHeadingElement>(null);
  const pickerWasOpen = useRef(false);
  useEffect(() => {
    if (picker !== null) pickerWasOpen.current = true;
    else if (pickerWasOpen.current) {
      // Replacing a keyed row removes its original opener; the editor title is the fallback.
      const target = pickerOpenerRef.current?.isConnected ? pickerOpenerRef.current : editorTitleRef.current;
      target?.focus(); pickerWasOpen.current = false;
    }
  }, [picker]);
  function openPicker(index: number, event: MouseEvent<HTMLButtonElement>) {
    pickerOpenerRef.current = event.currentTarget; setPicker(index); setRemove(null);
  }
  function move(index: number, offset: number) {
    const next = [...videos]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; setVideos(next);
  }
  return <div className="mt-5 space-y-4 border-t border-neutral-200 pt-5 dark:border-neutral-700">
    <h2 ref={editorTitleRef} tabIndex={-1} className="text-lg font-semibold">{t('edit')}</h2>
    <label className="block text-sm font-medium">{t('introduction')}
      <textarea autoFocus value={introduction} onChange={(event) => setIntroduction(event.target.value)} maxLength={1200} rows={4} disabled={pending}
        className="mt-2 w-full resize-y rounded-lg border border-neutral-300 bg-white p-3 text-sm focus:border-primary-800 focus:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:outline-primary-300" />
    </label>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('selectionHint')}</p>
    <ol className="divide-y divide-neutral-200 dark:divide-neutral-700">
      {videos.map((video, index) => <li key={video.asset_id} className="space-y-2 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">{index === 0 ? t('trailer') : t('position', { n: index + 1 })}</p>
            <p className="wrap-anywhere text-sm font-medium">{video.asset?.title ?? t('unavailable')}</p>
          </div>
          <Button outline disabled={pending || picker !== null || remove !== null || index === 0} onClick={() => move(index, -1)} aria-label={t('moveUp', { title: video.asset?.title ?? t('unavailable') })}>{t('up')}</Button>
          <Button outline disabled={pending || picker !== null || remove !== null || index === videos.length - 1} onClick={() => move(index, 1)} aria-label={t('moveDown', { title: video.asset?.title ?? t('unavailable') })}>{t('down')}</Button>
          <Button plain disabled={pending || picker !== null || remove !== null} onClick={(event: MouseEvent<HTMLButtonElement>) => openPicker(index, event)}>{t('replace')}</Button>
          <Button plain disabled={pending || picker !== null || remove !== null} onClick={() => { setRemove(index); setPicker(null); }}>{t('remove')}</Button>
        </div>
        {remove === index && <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{t('removeHint')}</span>
          <Button color="brand" disabled={pending} onClick={() => { setVideos((items) => items.filter((_, i) => i !== index)); setRemove(null); }}>{t('confirmRemove')}</Button>
          <Button outline onClick={() => setRemove(null)}>{t('cancel')}</Button>
        </div>}
      </li>)}
    </ol>
    <div className="flex flex-wrap items-center gap-3">
      {videos.length < 4 && <Button outline disabled={pending || picker !== null || remove !== null} onClick={(event: MouseEvent<HTMLButtonElement>) => openPicker(videos.length, event)}>{t('add')}</Button>}
      <Button outline href={`/feed/comunidades/${slug}/videos`} target="_blank" rel="noreferrer" aria-label={t('libraryNewTab')}>{t('library')}<ArrowTopRightOnSquareIcon className="size-4" /></Button>
    </div>
    {picker !== null && <LibraryAssetPicker communityId={communityId} kinds={['video']} editorId="showcase"
      attachedIds={videos.map((video) => video.asset_id)} onClose={() => setPicker(null)} onSelect={(asset) => {
        setVideos((items) => {
          const next = [...items]; next[picker] = { id: asset.id, community_id: communityId, asset_id: asset.id, position: picker, asset }; return next;
        });
      }} />}
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} disabled={pending}
        className="mt-0.5 rounded text-primary-800 focus:ring-primary-800" />
      <span>{t('publish')}<span className="mt-1 block text-neutral-600 dark:text-neutral-300">{t('privacyHint')}</span></span>
    </label>
    <div className="flex flex-wrap gap-2">
      <Button color="brand" disabled={pending || picker !== null || remove !== null} onClick={() => {
        const value = { communityId, expectedVersion: initial?.version ?? 0, introduction, isPublished: published, videoAssetIds: videos.map((video) => video.asset_id) };
        if (!showcaseSchema.safeParse(value).success) { setError(t('validationError')); return; }
        setError(null);
        startTransition(async () => {
          try {
            const result = await saveCommunityShowcase(value);
            if (!result.ok) { setError(result.error); return; }
            router.refresh(); onClose();
          } catch { setError(t('saveError')); }
        });
      }}>{t(pending ? 'saving' : 'save')}</Button>
      <Button outline disabled={pending} onClick={onClose}>{t('cancel')}</Button>
    </div>
    <PlanFeedback error={error} />
  </div>;
}
