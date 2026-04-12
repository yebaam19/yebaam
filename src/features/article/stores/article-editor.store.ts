'use client'

/**
 * Article Editor Store
 *
 * Zustand store for managing the TipTap editor instance
 * shared between the toolbar (in header) and the content editor
 */

import { Editor } from '@tiptap/react'
import { create } from 'zustand'

interface ArticleEditorState {
  // Editor instance shared between toolbar and content
  articleEditor: Editor | null

  // Force update counter to trigger re-renders when editor state changes
  editorForceUpdate: number

  // Actions
  setArticleEditor: (editor: Editor | null) => void
  forceEditorUpdate: () => void
  clearEditor: () => void
}

export const useArticleEditorStore = create<ArticleEditorState>((set) => ({
  articleEditor: null,
  editorForceUpdate: 0,

  setArticleEditor: (editor) => {
    set({ articleEditor: editor })
  },

  forceEditorUpdate: () => {
    set((state) => ({ editorForceUpdate: state.editorForceUpdate + 1 }))
  },

  clearEditor: () => {
    set({ articleEditor: null, editorForceUpdate: 0 })
  },
}))
