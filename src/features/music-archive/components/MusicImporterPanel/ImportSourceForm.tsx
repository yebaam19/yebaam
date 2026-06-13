import { useTranslations } from 'next-intl';

interface Props {
  url: string;
  pending: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ImportSourceForm({ url, pending, onUrlChange, onSubmit }: Props) {
  const t = useTranslations('musica.importer');

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {t('urlLabel')}
      </label>
      <div className="mt-1 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={t('urlPlaceholder')}
          required
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={pending || !url.trim()}
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? t('submitting') : t('submit')}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        {t('hint')}
      </p>
    </form>
  );
}
