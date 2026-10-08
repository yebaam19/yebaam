'use client';

import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { DocumentIcon } from '@/components/icons/heroicons-shim';
import { StreamVideo } from '@/components/media/StreamVideo';
import { imageUrl } from '@/lib/media/urls';
import { formatBytes } from '@/lib/upload-limits';
import type { LibraryAsset } from '../../types/communityLibrary.types';

export function LibraryAssetView({ asset, canEdit, children }: {
  asset: LibraryAsset; canEdit: boolean; children?: React.ReactNode;
}) {
  const t = useTranslations('communities.library');
  const format = useFormatter();
  const fileHref = `/api/communities/${asset.community_id}/assets/${asset.id}/file`;
  const document = asset.kind === 'document';
  return <article className={document ? 'flex min-w-0 items-start gap-3 border-b border-neutral-200 py-4 last:border-0 dark:border-neutral-700' : 'min-w-0 space-y-3'}>
    {document && <DocumentIcon aria-hidden="true" className="mt-1 size-6 shrink-0 text-neutral-500 dark:text-neutral-400" />}
    {asset.kind === 'image' && <a href={imageUrl(asset.media_id)} target="_blank" rel="noreferrer"
      aria-label={t('openImage', { title: asset.title })} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 dark:bg-neutral-900">
      <Image src={imageUrl(asset.media_id)} alt={asset.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 300px" className="object-cover" unoptimized />
    </a>}
    {asset.kind === 'video' && <StreamVideo uid={asset.media_id} title={asset.title} className="overflow-hidden rounded-lg" />}
    <div className="min-w-0 flex-1 space-y-1.5">
      <h3 className="break-words text-sm font-semibold">{asset.title}</h3>
      {asset.description && <p className="whitespace-pre-line break-words text-sm text-neutral-600 dark:text-neutral-300">{asset.description}</p>}
      <p className="flex flex-wrap gap-x-2 text-xs text-neutral-600 dark:text-neutral-400">
        <time dateTime={asset.created_at}>{format.dateTime(new Date(asset.created_at), { day: 'numeric', month: 'short', year: 'numeric' })}</time>
        {asset.size_bytes !== null && <span>{formatBytes(asset.size_bytes)}</span>}
        {document && <span>{asset.original_name.split('.').at(-1)?.toUpperCase()}</span>}
        {asset.uploader_name && <span>{t('uploadedBy', { name: asset.uploader_name })}</span>}
        {canEdit && <span>{!asset.is_published && <span className="text-secondary-900 dark:text-secondary-300">{t('draft')} · </span>}{t(`audience.${asset.visibility}`)}</span>}
      </p>
      {document ? <div className="flex flex-wrap items-start gap-x-4 gap-y-1 text-sm">
        <a href={fileHref} className="inline-flex min-h-11 items-center text-primary-800 underline-offset-4 hover:underline focus-visible:outline-2 dark:text-primary-300">{t('download')}</a>
        {['application/pdf', 'text/plain'].includes(asset.content_type) && <a href={`${fileHref}?preview=1`} target="_blank" rel="noreferrer"
          aria-label={t('previewNewTab')}
          className="inline-flex min-h-11 items-center text-primary-800 underline-offset-4 hover:underline focus-visible:outline-2 dark:text-primary-300">{t('preview')}</a>}
        {children}
      </div> : children}
    </div>
  </article>;
}
