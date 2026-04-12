'use client'

/**
 * RichTextEditor Component
 *
 * Rich text editor for article content using TipTap
 * Uses Zustand store to share editor instance between toolbar and content
 * Matching legacy ArticleEditor architecture
 */

import {
  BoldIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  ItalicIcon,
  LinkIcon,
  ListBulletIcon,
  PhotoIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState } from 'react'
import { useArticleEditorStore } from '../stores'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  isHeaderMode?: boolean
  onImageUpload?: (file: File) => Promise<string | null>
}

/**
 * HeaderToolbar Component
 *
 * Toolbar that reads the editor from Zustand store
 * and executes commands on the shared editor instance
 */
function HeaderToolbar({ onImageUpload }: { onImageUpload?: (file: File) => Promise<string | null> }) {
  const { articleEditor, editorForceUpdate, forceEditorUpdate } = useArticleEditorStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedStyle, setSelectedStyle] = useState('normal')

  // Update selected style based on editor state
  useEffect(() => {
    if (articleEditor) {
      if (articleEditor.isActive('heading', { level: 1 })) {
        setSelectedStyle('h1')
      } else if (articleEditor.isActive('heading', { level: 2 })) {
        setSelectedStyle('h2')
      } else {
        setSelectedStyle('normal')
      }
    }
  }, [articleEditor, editorForceUpdate])

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

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} no es una imagen válida`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} es muy grande (máximo 5MB)`)
        continue
      }

      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file)

      // If there's an upload handler, use it
      if (onImageUpload) {
        const uploadedUrl = await onImageUpload(file)
        if (uploadedUrl) {
          articleEditor.chain().focus().setImage({ src: uploadedUrl, alt: file.name }).run()
        } else {
          articleEditor.chain().focus().setImage({ src: blobUrl, alt: file.name }).run()
        }
      } else {
        articleEditor.chain().focus().setImage({ src: blobUrl, alt: file.name }).run()
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style)
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

  const ToolbarButton = ({
    onClick,
    isActive,
    title,
    children,
  }: {
    onClick: () => void
    isActive?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
      }`}
    >
      {children}
    </button>
  )

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

        <ToolbarButton onClick={handleImageClick} title="Imagen">
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

/**
 * Main RichTextEditor Component
 *
 * When isHeaderMode=true: renders HeaderToolbar that reads from store
 * When isHeaderMode=false: renders actual editor and registers it in store
 */
export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Comienza a escribir tu artículo...',
  isHeaderMode = false,
  onImageUpload,
}: RichTextEditorProps) {
  const { setArticleEditor, forceEditorUpdate, clearEditor } = useArticleEditorStore()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 hover:text-primary-500 underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      forceEditorUpdate()
    },
    onSelectionUpdate: () => {
      forceEditorUpdate()
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none text-lg leading-relaxed min-h-[400px] dark:prose-invert',
      },
    },
  })

  // Register editor in store when not in header mode
  useEffect(() => {
    if (editor && !isHeaderMode) {
      setArticleEditor(editor)
    }
  }, [editor, isHeaderMode, setArticleEditor])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (!isHeaderMode) {
        clearEditor()
      }
    }
  }, [isHeaderMode, clearEditor])

  // In header mode, render the toolbar that reads from store
  if (isHeaderMode) {
    return <HeaderToolbar onImageUpload={onImageUpload} />
  }

  // In content mode, render the actual editor
  return (
    <div className="w-full">
      <EditorContent editor={editor} className="focus:outline-none" />
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .dark .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
        }
        .ProseMirror img {
          border-radius: 0.5rem;
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #0ea5e9;
          background: #f5f5f5;
          padding: 0.5rem 1rem;
          margin-left: 0;
          margin-right: 0;
          border-radius: 0 0.375rem 0.375rem 0;
          font-style: italic;
          color: #404040;
        }
        .dark .ProseMirror blockquote {
          border-left-color: #0ea5e9;
          background: #262626;
          color: #d4d4d4;
        }
        .ProseMirror pre {
          background: #f5f5f5;
          color: #262626;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e5e5;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
        }
        .dark .ProseMirror pre {
          background: #262626;
          color: #e5e5e5;
          border-color: #404040;
        }
        .ProseMirror code {
          background: #f5f5f5;
          color: #0ea5e9;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .dark .ProseMirror code {
          background: #262626;
          color: #38bdf8;
        }
        .ProseMirror pre code {
          background: transparent;
          color: inherit;
          padding: 0;
          font-size: inherit;
        }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #171717;
        }
        .dark .ProseMirror h1 {
          color: #fafafa;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #171717;
        }
        .dark .ProseMirror h2 {
          color: #fafafa;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
          padding-left: 0.25rem;
        }
        .ProseMirror a {
          color: #0ea5e9;
          text-decoration: underline;
          cursor: pointer;
        }
        .ProseMirror a:hover {
          color: #0284c7;
        }
        .dark .ProseMirror a {
          color: #38bdf8;
        }
        .dark .ProseMirror a:hover {
          color: #7dd3fc;
        }
      `}</style>
    </div>
  )
}
