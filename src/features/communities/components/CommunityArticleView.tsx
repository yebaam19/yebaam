import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeftIcon, ClockIcon } from '@/components/icons/heroicons-shim';
import { StreamVideo } from '@/components/media/StreamVideo';
import { imageUrl } from '@/lib/media/urls';
import { splitCommunityArticleContent } from '../lib/article-content';
import type { CommunityArticle } from '../types/communityArticle.types';
import type { LibraryAsset } from '../types/communityLibrary.types';
import { LibraryAssetView } from './library/LibraryAssetView';
import { CommunityArticleActionsMenu } from './CommunityArticleActionsMenu';
import { CommunityArticleShareButton } from './CommunityArticleShareButton';

export function CommunityArticleView({ communitySlug, article, assets, canManage = false, isAuthor = false }: {
  communitySlug: string; article: CommunityArticle; assets: LibraryAsset[];
  canManage?: boolean; isAuthor?: boolean;
}) {
  const date = article.publishedAt && new Date(article.publishedAt).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const parts = splitCommunityArticleContent(article.content);
  return <article className="mx-auto max-w-4xl space-y-7 pb-10 text-neutral-900 dark:text-white">
    <Link href={`/feed/comunidades/${communitySlug}/articulos` as Route}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-800 underline-offset-4 hover:underline focus-visible:outline-2 dark:text-primary-300">
      <ArrowLeftIcon className="size-4" /> Volver a artículos
    </Link>
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary-800 dark:text-primary-300">
        {article.category && <span>{article.category}</span>}
        <span className={article.isPublished
          ? 'rounded-full bg-primary-50 px-2.5 py-1 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
          : 'rounded-full bg-secondary-100 px-2.5 py-1 text-secondary-900 dark:bg-secondary-900 dark:text-secondary-100'}>
          {article.isPublished ? 'Publicado' : 'Borrador privado'}
        </span>
      </div>
      <h1 className="max-w-[25ch] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{article.title}</h1>
      {article.subtitle && <p className="max-w-[65ch] text-lg text-neutral-700 dark:text-neutral-200">{article.subtitle}</p>}
      {article.summary && <p className="max-w-[70ch] text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{article.summary}</p>}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600 dark:text-neutral-300">
        {article.author.avatar && <Image src={article.author.avatar} alt="" width={28} height={28} unoptimized className="size-7 rounded-full object-cover" />}
        <span className="font-medium text-neutral-900 dark:text-white">{article.author.name}</span>
        {date && <><span aria-hidden="true">·</span><time dateTime={article.publishedAt!}>{date}</time></>}
        {article.readTime && <><span aria-hidden="true">·</span><ClockIcon className="size-4" aria-hidden="true" /><span>{article.readTime} min</span></>}
      </div>
    </header>
    {(article.isPublished || canManage) && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
      {article.isPublished && <CommunityArticleShareButton articleId={article.id} articleTitle={article.title}
        articlePath={`/feed/comunidades/${communitySlug}/articulos/${article.slug}`}
        communitySlug={communitySlug} isAuthor={isAuthor} />}
      {canManage && <CommunityArticleActionsMenu articleId={article.id} communitySlug={communitySlug}
        articleSlug={article.slug} articleTitle={article.title} />}
    </div>}
    {article.coverImageUrl && <div className="relative aspect-[16/8] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
      <Image src={article.coverImageUrl} alt={article.title} fill sizes="(max-width: 768px) 100vw, 900px"
        className="object-cover" priority unoptimized />
    </div>}
    <div className="space-y-5">
      {parts.map((part, index) => {
        if (part.html !== undefined) return <div key={index}
          className="prose prose-lg max-w-[70ch] dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: part.html }} />;
        const asset = byId.get(part.assetId);
        if (!asset || !['image', 'video'].includes(asset.kind)) return <p key={index} className="text-sm text-neutral-600 dark:text-neutral-300">Medio no disponible.</p>;
        return <figure key={index} className="space-y-2">
          {asset.kind === 'image' ? <Image src={imageUrl(asset.media_id)} alt={asset.title}
            width={1200} height={800} sizes="(max-width: 768px) 100vw, 900px"
            className="h-auto max-h-[42rem] w-full rounded-xl object-contain bg-neutral-100 dark:bg-neutral-900" unoptimized />
            : <StreamVideo uid={asset.media_id} title={asset.title} className="overflow-hidden rounded-xl" />}
          <figcaption className="text-sm text-neutral-600 dark:text-neutral-300">{asset.title}</figcaption>
        </figure>;
      })}
    </div>
    {article.attachmentIds.length > 0 && <section className="space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-700">
      <h2 className="text-lg font-semibold">Archivos adjuntos</h2>
      {article.attachmentIds.map((id) => {
        const asset = byId.get(id);
        return asset?.kind === 'document' ? <LibraryAssetView key={id} asset={asset} canEdit={canManage} />
          : <p key={id} className="text-sm text-neutral-600 dark:text-neutral-300">Archivo no disponible.</p>;
      })}
    </section>}
    {article.tags.length > 0 && <div className="flex flex-wrap gap-2">{article.tags.map((tag) =>
      <span key={tag} className="rounded-full bg-secondary-100 px-3 py-1 text-xs text-secondary-900 dark:bg-secondary-900 dark:text-secondary-100">#{tag}</span>)}</div>}
  </article>;
}
