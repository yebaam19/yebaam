'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useTranslations } from 'next-intl';
import { Bold, Italic, Heading2, List, ListOrdered, Quote, Undo2, Redo2 } from 'lucide-react';

export function PlanTextEditor({ content, onChange, disabled }: {
  content: string; onChange: (html: string) => void; disabled: boolean;
}) {
  const t = useTranslations('communities.plans');
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } })],
    content, immediatelyRender: false, shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: {
      role: 'textbox', 'aria-multiline': 'true', 'aria-label': t('content'),
      class: 'prose prose-sm min-h-40 max-w-none p-4 focus:outline-2 focus:outline-blue-500 dark:prose-invert',
    } },
  });
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  const controls = [
    { label: 'bold', Icon: Bold, active: editor?.isActive('bold'), run: () => editor?.chain().focus().toggleBold().run() },
    { label: 'italic', Icon: Italic, active: editor?.isActive('italic'), run: () => editor?.chain().focus().toggleItalic().run() },
    { label: 'heading', Icon: Heading2, active: editor?.isActive('heading'), run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'bulletList', Icon: List, active: editor?.isActive('bulletList'), run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: 'orderedList', Icon: ListOrdered, active: editor?.isActive('orderedList'), run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: 'quote', Icon: Quote, active: editor?.isActive('blockquote'), run: () => editor?.chain().focus().toggleBlockquote().run() },
    { label: 'undo', Icon: Undo2, run: () => editor?.chain().focus().undo().run() },
    { label: 'redo', Icon: Redo2, run: () => editor?.chain().focus().redo().run() },
  ];
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
      <div role="group" aria-label={t('formatting')} className="flex flex-wrap border-b border-gray-200 p-1 dark:border-gray-700">
        {controls.map(({ label, Icon, active, run }) => (
          <button key={label} type="button" title={t(`format.${label}`)} aria-label={t(`format.${label}`)}
            aria-pressed={active} disabled={!editor || disabled} onClick={run}
            className={`flex h-11 w-11 items-center justify-center rounded-lg disabled:opacity-40 ${active
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'}`}>
            <Icon size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
