import { getTranslations } from 'next-intl/server';
import {
  CalendarDaysIcon,
  GlobeAltIcon,
  HomeModernIcon,
  UsersIcon,
} from '@/components/icons/heroicons-shim';
import type { CityFacts } from '@/features/cities/server/city.server';

interface CityFactsCardProps {
  cityName: string;
  facts: CityFacts;
}

interface FactRow {
  id: 'population' | 'department' | 'altitude' | 'founded';
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
}

/**
 * "Conoce <city>" stats card. Renders the four canonical facts (Población,
 * Departamento, Altitud, Fundación) seeded from Wikidata. Rows whose value
 * is null are silently dropped — better than rendering "—" placeholders that
 * read like missing data.
 */
export async function CityFactsCard({ cityName, facts }: CityFactsCardProps) {
  const t = await getTranslations('cities.portal.knowCity');

  const rows: FactRow[] = [];

  if (facts.population !== null && facts.population > 0) {
    rows.push({
      id: 'population',
      label: t('population'),
      value: new Intl.NumberFormat('es-CO').format(facts.population),
      Icon: UsersIcon,
    });
  }

  if (facts.department) {
    rows.push({
      id: 'department',
      label: t('department'),
      value: facts.department,
      Icon: GlobeAltIcon,
    });
  }

  if (facts.altitudeM !== null) {
    rows.push({
      id: 'altitude',
      label: t('altitude'),
      value: `${new Intl.NumberFormat('es-CO').format(facts.altitudeM)} ${t('altitudeUnit')}`,
      Icon: HomeModernIcon,
    });
  }

  if (facts.foundedYear !== null) {
    rows.push({
      id: 'founded',
      label: t('founded'),
      value: String(facts.foundedYear),
      Icon: CalendarDaysIcon,
    });
  }

  if (rows.length === 0) return null;

  return (
    <section
      aria-label={t('heading', { city: cityName })}
      className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {t('heading', { city: cityName })}
      </h2>

      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {rows.map(({ id, label, value, Icon }) => (
          <li
            key={id}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              {label}
            </span>
            <span className="truncate text-right text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
