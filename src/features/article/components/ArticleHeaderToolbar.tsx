'use client'

import {
  BoldIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  ItalicIcon,
  LinkIcon,
  ListBulletIcon,
  PhotoIcon,
  QueueListIcon,
} from '@/components/icons/heroicons-shim'
import { useRef } from 'react'
import { useArticleEditorStore } from '../stores'
import { ToolbarButton } from './ArticleToolbarButton'

export function HeaderToolbar({ onImageUpload }: { onImageUpload?: (file: File) => Promise<string | null> }) {
  const { articleEditor, forceEditorUpdate } = useArticleEditorStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedStyle = articleEditor?.isActive('heading', { level: 1 }) ? 'h1'
    : articleEditor?.isActive('heading', { level: 2 }) ? 'h2' : 'normal'

  // Show loading state if editor not ready
  if (!articleEditor) {
    return <div className="flex items-center gap-1 text-xs text-neutral-400">Cargando editor...</div>
  }

  const addLink = () => {
    const url = window.prompt('Ingresa la URL del enlace:')

    if (url) {
      if (articleEditor.state.selection.empty) {
        const linkText = window.prompt('Ingresa el texto del enlace:')
        if (linkText) {
          articleEditor
            .chain()
            .focus()
            .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`)
            .run()
        }
      } else {
        articleEditor.chain().focus().setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' }).run()
      }
    }
  }

  // Sin manejador de subida NO se insertan imágenes: un blob: URL solo vive en
  // esta sesión y quedaría persistido en el contenido, roto tras recargar.
  const canUploadImages = !!onImageUpload

  const handleImageClick = () => {
    if (!canUploadImages) return
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !onImageUpload) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} no es una imagen válida`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} es muy grande (máximo 5MB)`)
        continue
      }

      const uploadedUrl = await onImageUpload(file)
      if (uploadedUrl) {
        articleEditor.chain().focus().setImage({ src: uploadedUrl, alt: file.name }).run()
      } else {
        alert(`No se pudo subir ${file.name}. Inténtalo de nuevo.`)
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleStyleChange = (style: string) => {
    switch (style) {
      case 'normal':
        articleEditor.chain().focus().setParagraph().run()
        break
      case 'h1':
        articleEditor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case 'h2':
        articleEditor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      default:
        articleEditor.chain().focus().setParagraph().run()
    }
    forceEditorUpdate()
  }

  const handleBoldClick = () => {
    articleEditor.chain().focus().toggleBold().run()
    forceEditorUpdate()
  }

  const handleItalicClick = () => {
    articleEditor.chain().focus().toggleItalic().run()
    forceEditorUpdate()
  }

  const handleBulletListClick = () => {
    articleEditor.chain().focus().toggleBulletList().run()
    forceEditorUpdate()
  }

  const handleOrderedListClick = () => {
    articleEditor.chain().focus().toggleOrderedList().run()
    forceEditorUpdate()
  }

  const handleBlockquoteClick = () => {
    articleEditor.chain().focus().toggleBlockquote().run()
    forceEditorUpdate()
  }

  const handleCodeBlockClick = () => {
    articleEditor.chain().focus().toggleCodeBlock().run()
    forceEditorUpdate()
  }


  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex items-center justify-center gap-1 sm:justify-start">
        {/* Style selector */}
        <select
          value={selectedStyle}
          onChange={(e) => handleStyleChange(e.target.value)}
          className={`h-8 w-28 rounded border-none bg-transparent px-2 text-xs outline-none hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
            selectedStyle !== 'normal'
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
              : ''
          }`}
        >
          <option value="normal">Normal</option>
          <option value="h1">Titular</option>
          <option value="h2">Subtitular</option>
        </select>

        <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

        <ToolbarButton onClick={handleBoldClick} isActive={articleEditor.isActive('bold')} title="Negrita">
          <BoldIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton onClick={handleItalicClick} isActive={articleEditor.isActive('italic')} title="Cursiva">
          <ItalicIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="flex items-center justify-center gap-1 sm:justify-start">
        <div className="mx-1 hidden h-4 w-px bg-neutral-200 sm:block dark:bg-neutral-700" />

        <ToolbarButton onClick={handleBulletListClick} isActive={articleEditor.isActive('bulletList')} title="Lista">
          <ListBulletIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleOrderedListClick}
          isActive={articleEditor.isActive('orderedList')}
          title="Lista numerada"
        >
          <QueueListIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

        <ToolbarButton onClick={handleBlockquoteClick} isActive={articleEditor.isActive('blockquote')} title="Cita">
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton onClick={handleCodeBlockClick} isActive={articleEditor.isActive('codeBlock')} title="Código">
          <CodeBracketIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleImageClick}
          title={canUploadImages ? 'Imagen' : 'Imagen (no disponible)'}
          disabled={!canUploadImages}
        >
          <PhotoIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton onClick={addLink} isActive={articleEditor.isActive('link')} title="Enlace">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
    </div>
  )
}

