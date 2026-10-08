'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, ImagePlus, Italic, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';
import { CommunityAssetNode } from './CommunityAssetNode';

export function ArticleEditor({ communityId, content, onChange, disabled }: {
  communityId: string; content: string; onChange: (value: string) => void; disabled: boolean;
}) {
  const t = useTranslations('communities.plans');
  const [pickerOpen, setPickerOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }), CommunityAssetNode],
    content, immediatelyRender: false, shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: { attributes: {
      role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Cuerpo del artículo',
      class: 'prose prose-sm min-h-56 max-w-none p-4 focus:outline-2 focus:outline-primary-800 dark:focus:outline-primary-300 dark:prose-invert',
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
  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Contenido</h2>
      <Button ref={opener} outline disabled={!editor || disabled || pickerOpen} onClick={() => setPickerOpen(true)}>
        <ImagePlus size={18} aria-hidden="true" /> Insertar imagen o video
      </Button>
    </div>
    <div className="overflow-hidden rounded-xl border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900">
      <div role="group" aria-label={t('formatting')} className="flex flex-wrap border-b border-neutral-200 p-1 dark:border-neutral-700">
        {controls.map(({ label, Icon, active, run }) => <button key={label} type="button"
          title={t(`format.${label}`)} aria-label={t(`format.${label}`)} aria-pressed={active}
          disabled={!editor || disabled} onClick={run}
          className={`flex h-11 w-11 items-center justify-center rounded-lg disabled:opacity-40 ${active
            ? 'bg-secondary-100 text-primary-900 dark:bg-primary-900 dark:text-secondary-200'
            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'}`}>
          <Icon size={18} aria-hidden="true" />
        </button>)}
      </div>
      <EditorContent editor={editor} />
    </div>
    <p className="text-xs text-neutral-600 dark:text-neutral-300">Las imágenes y videos se insertan desde la biblioteca de la comunidad.</p>
    {pickerOpen && <LibraryAssetPicker communityId={communityId} editorId="article-body" kinds={['image', 'video']}
      attachedIds={[]} onClose={() => { setPickerOpen(false); opener.current?.focus(); }}
      onSelect={(asset) => {
        editor?.chain().focus().insertContent({ type: 'communityAsset', attrs: { assetId: asset.id } }).run();
        setPickerOpen(false); opener.current?.focus();
      }} />}
  </section>;
}
