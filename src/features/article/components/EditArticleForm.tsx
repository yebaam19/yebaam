'use client'

/**
 * EditArticleForm Component
 *
 * Form for editing existing articles with pre-populated content
 * Matching legacy EditArticleForm with header toolbar
 */

import { Button } from '@/ui/Button'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { uploadService } from '@/lib/service/upload.service'
import { Article, ArticleVisibility } from '../interfaces'
import { updateArticleAction } from '../actions/articles.actions'
import { CoverImageArea } from './CoverImageArea'
import { EditableTitle } from './EditableTitle'
import { EditArticleFormHeader } from './EditArticleFormHeader'

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

interface EditArticleFormProps {
  article: Article
  user: ArticleUser
}

export function EditArticleForm({ article, user }: EditArticleFormProps) {
  const router = useRouter()
  const t = useTranslations('article.editor')

  const [title, setTitle] = useState(article.title)
  const [content, setContent] = useState(article.content)
  const [coverImageUrl, setCoverImageUrl] = useState<string>(article.headerImageUrl || '')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const handleCoverUpload = (file: File) => {
    setCoverImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setCoverImageUrl(previewUrl)
  }

  const handleCoverRemove = () => {
    if (coverImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(coverImageUrl)
    }
    setCoverImageFile(null)
    setCoverImageUrl('')
  }

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
  const handleEditorImageUpload = async (file: File): Promise<string | null> => {
    try {
      const { url } = await uploadService.uploadImage(file)
      return url
    } catch {
      return null
    }
  }

  const handleUpdate = async () => {
    if (!title.trim()) {
      alert(t('titleRequired'))
      return
    }

    if (!content.trim() || content === '<p></p>') {
      alert(t('contentRequired'))
      return
    }

    setIsUpdating(true)

    try {
      // Portada: undefined = sin cambios; id de Cloudflare = reemplazar; null = quitar.
      // Si hay archivo nuevo se sube a Cloudflare Images y se envía solo el id.
      let cfImageId: string | null | undefined
      if (coverImageFile) {
        const uploaded = await uploadService.uploadImage(coverImageFile)
        cfImageId = uploaded.id
      } else if (!coverImageUrl && article.headerImageUrl) {
        cfImageId = null
      }

      const result = await updateArticleAction(article.id, {
        title: title.trim(),
        subtitle: article.subtitle ?? undefined,
        content,
        tags: article.tags,
        visibility: article.visibility === ArticleVisibility.PRIVATE ? 'private' : 'public',
        cfImageId,
      })

      if (result.ok) {
        setShowSuccessDialog(true)
      } else {
        alert(t('updateError', { message: result.error || t('unknownError') }))
      }
    } catch (error) {
      console.error('Error updating article:', error)
      alert(t('updateError', { message: error instanceof Error ? error.message : t('unknownError') }))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    router.push(`/feed/article/${article.id}`)
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    router.push(`/feed/article/${article.id}`)
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-neutral-900">
      {/* Header with user info, toolbar and action buttons */}
      <EditArticleFormHeader
        user={user}
        articleTitle={article.title}
        onUpdate={handleUpdate}
        onCancel={handleCancel}
        isUpdating={isUpdating}
        toolbarSlot={
          <RichTextEditor
            content={content}
            onChange={setContent}
            isHeaderMode={true}
            onImageUpload={handleEditorImageUpload}
          />
        }
      />

      {/* Main content area */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
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
      <Dialog open={showSuccessDialog} onClose={handleSuccessClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-800">
            <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t('successUpdatedTitle')}
            </DialogTitle>
            <Description className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('successUpdatedDescription')}
            </Description>
            <div className="mt-4 flex justify-end">
              <Button color="primary" onClick={handleSuccessClose}>
                {t('viewArticle')}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
