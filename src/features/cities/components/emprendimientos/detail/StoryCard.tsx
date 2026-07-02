import { getTranslations } from 'next-intl/server';

interface Props {
  story: string | null;
}

/** Wireframe "Acerca del emprendimiento: historia personal". */
export async function StoryCard({ story }: Props) {
  const t = await getTranslations('cities.emprendimientos.detail');
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {t('aboutTitle')}
      </h2>
      {story ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          {story}
        </p>
      ) : (
        <p className="mt-3 text-sm italic text-neutral-500 dark:text-neutral-400">{t('noStory')}</p>
      )}
    </div>
  );
}
