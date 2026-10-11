'use client'

/**
 * RichTextEditor Component
 *
 * Rich text editor for article content using TipTap
 * Uses Zustand store to share editor instance between toolbar and content
 * Matching legacy ArticleEditor architecture
 */

import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { HeaderToolbar } from './ArticleHeaderToolbar'
import { useArticleEditorStore } from '../stores'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  isHeaderMode?: boolean
  onImageUpload?: (file: File) => Promise<string | null>
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
