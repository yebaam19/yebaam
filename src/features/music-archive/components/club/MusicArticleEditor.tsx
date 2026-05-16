'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { createMusicArticle } from '../../actions/music-articles.actions';
import { ArtistTagPicker } from './ArtistTagPicker';
import { LabelTagPicker } from './LabelTagPicker';

interface Props {
  clubId: string;
  clubSlug: string;
}

interface ArtistRef {
  id: string;
  name: string;
  slug: string;
}

interface LabelRef {
  id: string;
  name: string;
  slug: string;
}

/** Composer for new articles. Hero image goes to Cloudflare Images via the
 *  shared uploadService. On success → /musica/clubes/<slug>/articulos/<new>. */
export function MusicArticleEditor({ clubId, clubSlug }: Props) {
  const t = useTranslations('musica.article.editor');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [hero, setHero] = useState<File | null>(null);
  const [artists, setArtists] = useState<ArtistRef[]>([]);
  const [labels, setLabels] = useState<LabelRef[]>([]);
  const [publish, setPublish] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        let cfImageId: string | null = null;
        if (hero) {
          const up = await uploadService.uploadImage(hero);
          cfImageId = up.id;
        }
        const res = await createMusicArticle({
          clubId,
          title,
          subtitle: subtitle.trim() || null,
          summary: summary.trim() || null,
          content,
          cfImageId,
          artistIds: artists.map((a) => a.id),
          labelIds: labels.map((l) => l.id),
          publish,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(
          `/musica/clubes/${clubSlug}/articulos/${res.data.slug}` as Route,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errGeneric'));
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('titleLabel')}
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('subtitleLabel')}
        </label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder={t('subtitlePlaceholder')}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('summaryLabel')}
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          placeholder={t('summaryPlaceholder')}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('heroLabel')}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setHero(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>

      <ArtistTagPicker value={artists} onChange={setArtists} />

      <LabelTagPicker value={labels} onChange={setLabels} />

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('contentLabel')}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          placeholder={t('contentPlaceholder')}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          />
          {t('publishImmediately')}
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !title.trim()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
        >
          {pending ? t('submitSaving') : publish ? t('submitPublish') : t('submitDraft')}
        </button>
      </div>
    </div>
  );
}
