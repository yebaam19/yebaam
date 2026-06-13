'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import {
  createCommunityArticle,
  updateCommunityArticle,
} from '@/features/communities/actions/communityArticles.actions';
import type { CommunityArticle } from '@/features/communities/types/communityArticle.types';
import { ComposerHeader } from './CommunityArticleComposer/ComposerHeader';
import { CoverField } from './CommunityArticleComposer/CoverField';
import { TitleFields } from './CommunityArticleComposer/TitleFields';
import { ArticleEditor } from './CommunityArticleComposer/ArticleEditor';
import { TagsField } from './CommunityArticleComposer/TagsField';

interface CommunityArticleComposerProps {
  communityId: string;
  communitySlug: string;
  /** When provided, the composer renders in edit mode and submits to updateCommunityArticle. */
  initialArticle?: CommunityArticle;
  /** Cloudflare image id of the current cover (only when editing). */
  initialCoverImageId?: string | null;
}

export function CommunityArticleComposer({
  communityId,
  communitySlug,
  initialArticle,
  initialCoverImageId,
}: CommunityArticleComposerProps) {
  const router = useRouter();
  const t = useTranslations('communities');
  const isEditing = Boolean(initialArticle);

  const [title, setTitle] = useState(initialArticle?.title ?? '');
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle ?? '');
  const [content, setContent] = useState(initialArticle?.content ?? '');
  const [tagsInput, setTagsInput] = useState(initialArticle?.tags.join(', ') ?? '');
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialArticle?.coverImageUrl ?? null,
  );
  const [coverImageId, setCoverImageId] = useState<string | null>(initialCoverImageId ?? null);
  const [coverDirty, setCoverDirty] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCoverChange = async (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('admin.article.composer.errorCoverImage'));
      return;
    }
    setUploadingCover(true);
    setCoverPreview(URL.createObjectURL(file));
    try {
      const { id, url } = await uploadService.uploadImage(file);
      setCoverImageId(id);
      setCoverPreview(url);
      setCoverDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.article.composer.errorCoverUpload'));
      setCoverPreview(initialArticle?.coverImageUrl ?? null);
      setCoverImageId(initialCoverImageId ?? null);
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverImageId(null);
    setCoverDirty(true);
  };

  const handleEditorImageUpload = async (file: File): Promise<string | null> => {
    try {
      const { url } = await uploadService.uploadImage(file);
      return url;
    } catch {
      return null;
    }
  };

  const handleSubmit = () => {
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('admin.article.composer.errorTitleRequired'));
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      setError(t('admin.article.composer.errorContentRequired'));
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    startTransition(async () => {
      if (isEditing && initialArticle) {
        // Map UI cover state → cfImageId update semantics:
        //   not changed     → undefined (omit)
        //   removed         → null
        //   replaced/added  → string id
        const cfImageIdField = !coverDirty
          ? undefined
          : coverImageId === null
            ? null
            : coverImageId;

        const result = await updateCommunityArticle({
          articleId: initialArticle.id,
          title: trimmedTitle,
          subtitle: subtitle.trim() || undefined,
          content,
          cfImageId: cfImageIdField,
          tags,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/feed/comunidades/${communitySlug}/articulos/${result.slug}` as Route);
        return;
      }

      const result = await createCommunityArticle({
        communityId,
        title: trimmedTitle,
        subtitle: subtitle.trim() || undefined,
        content,
        cfImageId: coverImageId ?? undefined,
        tags,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/feed/comunidades/${communitySlug}/articulos/${result.slug}` as Route);
    });
  };

  const submitLabel = isPending
    ? isEditing
      ? t('admin.article.composer.submitSaving')
      : t('admin.article.composer.submitPublishing')
    : isEditing
      ? t('admin.article.composer.submitSave')
      : t('admin.article.composer.submitPublish');

  return (
    <div className="space-y-5">
      <ComposerHeader
        isEditing={isEditing}
        submitLabel={submitLabel}
        isPending={isPending}
        uploadingCover={uploadingCover}
        onCancel={() => router.back()}
        onSubmit={handleSubmit}
      />

      {error && (
        <p className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <CoverField
        coverPreview={coverPreview}
        uploadingCover={uploadingCover}
        onCoverChange={handleCoverChange}
        onRemoveCover={removeCover}
      />

      <TitleFields
        title={title}
        subtitle={subtitle}
        onTitleChange={setTitle}
        onSubtitleChange={setSubtitle}
      />

      <ArticleEditor
        content={content}
        onChange={setContent}
        onImageUpload={handleEditorImageUpload}
      />

      <TagsField tagsInput={tagsInput} onTagsChange={setTagsInput} />
    </div>
  );
}
