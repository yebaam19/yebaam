import { getTranslations } from 'next-intl/server';

interface CityAboutCardProps {
  cityName: string;
  description: string | null | undefined;
}

export async function CityAboutCard({ cityName, description }: CityAboutCardProps) {
  if (!description?.trim()) return null;
  const t = await getTranslations('cities.portal.about');
  const heading = t('heading', { city: cityName });

  return (
    <section
      aria-label={heading}
      className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {heading}
      </h2>
      <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {description}
      </p>
    </section>
  );
}
