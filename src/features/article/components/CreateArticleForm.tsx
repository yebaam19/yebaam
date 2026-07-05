'use client'

/**
 * CreateArticleForm Component
 *
 * Form for creating new articles with cover image, title, content editor,
 * and context selection. Matching legacy UI/UX with header toolbar.
 */

import Avatar from '@/ui/Avatar'
import { Button } from '@/ui/Button'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArticleContextType } from '../interfaces'
import { createArticleAction } from '../actions/articles.actions'
import { uploadService } from '@/lib/service/upload.service'
import { ArticleContextSelector } from './ArticleContextSelector'
import { ArticleCreatedDialog } from './ArticleCreatedDialog'
import { CoverImageArea } from './CoverImageArea'
import { EditableTitle } from './EditableTitle'

// Dynamic import for rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('./RichTextEditor').then((mod) => mod.RichTextEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  ),
})

interface ArticleUser {
  id: string
  avatarUrl: string | null
  displayName: string
  username: string
}

interface CreateArticleFormProps {
  user: ArticleUser
}

export function CreateArticleForm({ user }: CreateArticleFormProps) {
  const router = useRouter()
  const t = useTranslations('article.editor')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingContexts, setIsLoadingContexts] = useState(true)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdArticle, setCreatedArticle] = useState<{ id: string; title: string } | null>(null)
  const [selectedContext, setSelectedContext] = useState<{
    type: ArticleContextType
    id: string | null
    name: string
  }>({
    type: ArticleContextType.USER_PROFILE,
    id: null,
    name: t('individualArticle'),
  })

  // Contexts are loaded inside ArticleContextSelector; nothing to fetch here.
  useEffect(() => {
    setIsLoadingContexts(false)
  }, [user.id])

  const handleCoverUpload = useCallback((file: File) => {
    setCoverImageFile(file)
    const url = URL.createObjectURL(file)
    setCoverImageUrl(url)
  }, [])

  const handleCoverRemove = useCallback(() => {
    if (coverImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(coverImageUrl)
    }
    setCoverImageUrl('')
    setCoverImageFile(null)
  }, [coverImageUrl])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (coverImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverImageUrl)
      }
    }
  }, [coverImageUrl])

  // Las imágenes insertadas en el editor se suben a Cloudflare de inmediato;
  // sin este handler quedarían como blob: URLs muertas tras recargar.
  const handleEditorImageUpload = useCallback(async (file: File): Promise<string | null> => {
    try {
      const { url } = await uploadService.uploadImage(file)
      return url
    } catch {
      return null
    }
  }, [])

  const handlePublish = async () => {
    if (!title.trim()) {
      alert(t('titleRequired'))
      return
    }

    if (!content.trim() || content === '<p></p>') {
      alert(t('contentRequired'))
      return
    }

    setIsPublishing(true)

    try {
      // Upload the cover to Cloudflare Images first (if any); we only persist
      // the resulting cf image id, never the blob/delivery URL.
      let cfImageId: string | null = null
      if (coverImageFile) {
        const uploaded = await uploadService.uploadImage(coverImageFile)
        cfImageId = uploaded.id
      }

      const result = await createArticleAction({
        title: title.trim(),
        content,
        cfImageId,
        tags: [],
        visibility: 'public',
      })

      if (result.ok) {
        setCreatedArticle({ id: result.data.id, title: title.trim() })
        setShowSuccessDialog(true)
      } else {
        alert(t('createError', { message: result.error || t('unknownError') }))
      }
    } catch (error) {
      console.error('Error publishing article:', error)
      alert(t('publishError', { message: error instanceof Error ? error.message : t('unknownError') }))
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    if (createdArticle) {
      router.push(`/feed/article/${createdArticle.id}`)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-neutral-900">
      {/* Header with user info, context selector, toolbar and publish button */}
      <div className="sticky top-[106px] z-20 border-b border-neutral-200 bg-white md:top-14 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl px-4">
          {/* Desktop Layout */}
          <div className="hidden items-center justify-between gap-4 py-3 lg:flex">
            <div className="flex shrink-0 items-center gap-3">
              <Avatar
                src={user.avatarUrl}
                alt={user.displayName}
                initials={user.displayName?.slice(0, 2).toUpperCase()}
                className="h-8 w-8"
              />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{user.displayName}</p>
                <ArticleContextSelector
                  selectedContext={selectedContext}
                  onSelect={setSelectedContext}
                  authorId={user.id}
                  isLoading={isLoadingContexts}
                  variant="compact"
                />
              </div>
            </div>

            {/* Toolbar in header */}
            <div className="max-w-md flex-1">
              <RichTextEditor
                content={content}
                onChange={setContent}
                isHeaderMode={true}
                onImageUpload={handleEditorImageUpload}
              />
            </div>

            <Button color="primary" onClick={handlePublish} className="shrink-0" disabled={isPublishing}>
              {isPublishing ? t('publishing') : t('publish')}
            </Button>
          </div>

          {/* Mobile Layout */}
          <div className="space-y-3 py-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.displayName}
                  initials={user.displayName?.slice(0, 2).toUpperCase()}
                  className="h-8 w-8"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{user.displayName}</p>
                  <ArticleContextSelector
                    selectedContext={selectedContext}
                    onSelect={setSelectedContext}
                    authorId={user.id}
                    isLoading={isLoadingContexts}
                    variant="compact"
                  />
                </div>
              </div>
              <Button color="primary" onClick={handlePublish} className="shrink-0" disabled={isPublishing}>
                {isPublishing ? t('publishing') : t('publish')}
              </Button>
            </div>

            {/* Toolbar for mobile */}
            <div className="flex justify-center">
              <RichTextEditor
                content={content}
                onChange={setContent}
                isHeaderMode={true}
                onImageUpload={handleEditorImageUpload}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <CoverImageArea
          coverImageUrl={coverImageUrl}
          onCoverUpload={handleCoverUpload}
          onCoverRemove={handleCoverRemove}
        />

        <EditableTitle title={title} onTitleChange={setTitle} placeholder={t('titlePlaceholder')} />

        <div>
          <RichTextEditor
            content={content}
            onChange={setContent}
            isHeaderMode={false}
            onImageUpload={handleEditorImageUpload}
          />
        </div>
      </div>

      {/* Success Dialog */}
      <ArticleCreatedDialog isOpen={showSuccessDialog} onClose={handleSuccessDialogClose} article={createdArticle} />
    </div>
  )
}
