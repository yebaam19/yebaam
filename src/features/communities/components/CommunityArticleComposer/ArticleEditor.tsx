import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const RichTextEditor = dynamic(
  () => import('@/features/article/components/RichTextEditor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    ),
  },
);

interface ArticleEditorProps {
  content: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string | null>;
}

export function ArticleEditor({ content, onChange, onImageUpload }: ArticleEditorProps) {
  const t = useTranslations('communities');

  return (
    <section className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5 space-y-4">
      <RichTextEditor
        content=""
        isHeaderMode
        onImageUpload={onImageUpload}
        onChange={() => {
          /* toolbar mode does not emit content */
        }}
      />
      <RichTextEditor
        content={content}
        onChange={onChange}
        placeholder={t('admin.article.composer.contentPlaceholder')}
        onImageUpload={onImageUpload}
      />
    </section>
  );
}
