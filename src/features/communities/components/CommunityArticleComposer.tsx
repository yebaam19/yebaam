'use client';

import { useRef, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import { createCommunityArticle, updateCommunityArticle } from '../actions/communityArticles.actions';
import type { CommunityArticle } from '../types/communityArticle.types';
import type { LibraryAsset } from '../types/communityLibrary.types';
import { CoverField } from './CommunityArticleComposer/CoverField';
import { ArticleAttachments } from './CommunityArticleComposer/ArticleAttachments';

const ArticleEditor = dynamic(() => import('./CommunityArticleComposer/ArticleEditor').then((module) => module.ArticleEditor), {
  ssr: false,
  loading: () => <div className="min-h-56 rounded-xl bg-neutral-100 dark:bg-neutral-900" aria-label="Cargando editor" />,
});

export function CommunityArticleComposer({ communityId, communitySlug, initialArticle, initialAttachments = [] }: {
  communityId: string; communitySlug: string; initialArticle?: CommunityArticle;
  initialAttachments?: LibraryAsset[];
}) {
  const router = useRouter();
  const id = useRef(initialArticle?.id ?? null);
  const [title, setTitle] = useState(initialArticle?.title ?? '');
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle ?? '');
  const [summary, setSummary] = useState(initialArticle?.summary ?? '');
  const [category, setCategory] = useState(initialArticle?.category ?? '');
  const [content, setContent] = useState(initialArticle?.content ?? '');
  const [tags, setTags] = useState(initialArticle?.tags.join(', ') ?? '');
  const [coverAssetId, setCoverAssetId] = useState(initialArticle?.coverAssetId ?? null);
  const [coverPreview, setCoverPreview] = useState(initialArticle?.coverImageUrl ?? null);
  const [coverDirty, setCoverDirty] = useState(false);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const base = `/feed/comunidades/${communitySlug}/articulos`;

  function save(isPublished: boolean) {
    if (pending) return;
    setError(null);
    id.current ??= crypto.randomUUID();
    const fields = {
      title, subtitle, summary, category, content,
      tags: tags.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean),
      coverAssetId, attachmentIds: attachments.map((asset) => asset.id), isPublished,
    };
    startTransition(async () => {
      try {
        const result = initialArticle
          ? await updateCommunityArticle({ ...fields, communityId, articleId: initialArticle.id,
            expectedVersion: initialArticle.version, keepLegacyCover: !coverDirty })
          : await createCommunityArticle({ ...fields, id: id.current!, communityId });
        if (!result.ok) { setError(result.error); return; }
        router.replace(`${base}/${result.slug}` as Route);
        router.refresh();
      } catch {
        setError('No se pudo guardar. Comprueba tu conexión y vuelve a intentarlo.');
      }
    });
  }

  return <section className="mx-auto max-w-4xl space-y-6 pb-10 text-neutral-900 dark:text-white">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{initialArticle ? 'Editar artículo' : 'Nuevo artículo'}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Guarda el texto en privado y publícalo cuando esté listo.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button outline disabled={pending} onClick={() => router.push((initialArticle ? `${base}/${initialArticle.slug}` : base) as Route)}>Cancelar</Button>
        <Button outline disabled={pending} onClick={() => save(false)}>{pending ? 'Guardando…' : 'Guardar borrador'}</Button>
        <Button color="brand" disabled={pending} onClick={() => save(true)}>{pending ? 'Guardando…' : 'Publicar'}</Button>
      </div>
    </header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2 text-sm font-medium">Título
        <Input autoFocus value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)}
          placeholder="Título del artículo" className="mt-1" />
      </label>
      <label className="sm:col-span-2 text-sm font-medium">Subtítulo
        <Input value={subtitle} maxLength={240} onChange={(event) => setSubtitle(event.target.value)}
          placeholder="Una línea que dé contexto" className="mt-1" />
      </label>
      <label className="sm:col-span-2 text-sm font-medium">Resumen
        <textarea value={summary} maxLength={500} rows={3} onChange={(event) => setSummary(event.target.value)}
          placeholder="Qué encontrará quien abra el artículo" className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900" />
      </label>
      <label className="text-sm font-medium">Categoría
        <Input value={category} maxLength={120} onChange={(event) => setCategory(event.target.value)}
          placeholder="Ej. Vida comunitaria" className="mt-1" />
      </label>
      <label className="text-sm font-medium">Etiquetas
        <Input value={tags} onChange={(event) => setTags(event.target.value)}
          placeholder="Separadas por comas" className="mt-1" />
      </label>
    </div>
    <CoverField communityId={communityId} slug={communitySlug} coverPreview={coverPreview}
      coverAssetId={coverAssetId} disabled={pending}
      onChange={(assetId, preview) => { setCoverAssetId(assetId); setCoverPreview(preview); setCoverDirty(true); }} />
    <ArticleEditor communityId={communityId} content={content} onChange={setContent} disabled={pending} />
    <ArticleAttachments communityId={communityId} slug={communitySlug} assets={attachments}
      disabled={pending} onChange={setAttachments} />
  </section>;
}
