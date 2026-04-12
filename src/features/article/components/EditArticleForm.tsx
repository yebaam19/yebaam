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
import { Article, UpdateArticleData } from '../interfaces'
import { articleService } from '../services'
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

  const handleUpdate = async () => {
    if (!title.trim()) {
      alert('Por favor, añade un título al artículo')
      return
    }

    if (!content.trim() || content === '<p></p>') {
      alert('Por favor, añade contenido al artículo')
      return
    }

    setIsUpdating(true)

    try {
      // TODO: In real implementation, upload cover image to server first if changed
      const headerImageUrl = coverImageUrl || undefined

      const updateData: UpdateArticleData = {
        title: title.trim(),
        content,
        headerImageUrl,
        visibility: article.visibility,
      }

      const result = await articleService.updateArticle(article.id, updateData, user.id)

      if (result.success) {
        setShowSuccessDialog(true)
      } else {
        alert(`Error al actualizar el artículo: ${result.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error updating article:', error)
      alert(`Error al actualizar el artículo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
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
        toolbarSlot={<RichTextEditor content={content} onChange={setContent} isHeaderMode={true} />}
      />

      {/* Main content area */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <CoverImageArea
          coverImageUrl={coverImageUrl}
          onCoverUpload={handleCoverUpload}
          onCoverRemove={handleCoverRemove}
        />

        <EditableTitle title={title} onTitleChange={setTitle} placeholder="Título" />

        <div>
          <RichTextEditor content={content} onChange={setContent} isHeaderMode={false} />
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleSuccessClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-800">
            <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
              ¡Artículo actualizado!
            </DialogTitle>
            <Description className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Los cambios se han guardado correctamente.
            </Description>
            <div className="mt-4 flex justify-end">
              <Button color="primary" onClick={handleSuccessClose}>
                Ver artículo
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
