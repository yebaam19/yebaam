import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { GenreBrowser } from '@/features/music-archive/components/genre/GenreBrowser';
import {
  MUSIC_ARCHIVE_PUBLIC_COUNTRY_FILTERS,
  sortCountryCodesByLabel,
} from '@/features/music-archive/components/upload/constants';
import {
  ALBUM_CONDITION_LABELS,
  type AlbumCondition,
} from '@/features/music-archive/types/music.types';
import type { MusicGenreRow } from '@/features/music-archive/server/genres.server';
import { LANDING_DECADES } from './musica-decades';
import { MusicFilterSection } from './MusicFilterSection';

interface MusicFilters {
  decade?: number;
  country?: string;
  forTrade: boolean;
  genreSlug?: string;
  conditionValue?: AlbumCondition;
}

interface Props extends MusicFilters {
  genres: MusicGenreRow[];
}

function buildHref(opts: {
  decade?: number;
  country?: string;
  forTrade?: boolean;
  genre?: string;
  condition?: string;
}): Route {
  const params = new URLSearchParams();
  if (opts.decade !== undefined) params.set('decade', String(opts.decade));
  if (opts.country) params.set('country', opts.country);
  if (opts.forTrade) params.set('trade', '1');
  if (opts.genre) params.set('genre', opts.genre);
  if (opts.condition) params.set('condition', opts.condition);
  const qs = params.toString();
  return (qs ? `/musica?${qs}` : '/musica') as Route;
}

/** The secondary filter navigation on the `/musica` landing page: decade,
 *  for-trade, genre, condition, and country pills. Each pill toggles its own
 *  axis while preserving the other active filters in the query string. */
export async function MusicFilterRail({
  decade,
  country,
  forTrade,
  genreSlug,
  conditionValue,
  genres,
}: Props) {
  const t = await getTranslations('musica');
  const base = { decade, country, forTrade, genre: genreSlug, condition: conditionValue };
  const href = (override: Parameters<typeof buildHref>[0]) => buildHref({ ...base, ...override });
  const sortedCountries = sortCountryCodesByLabel(MUSIC_ARCHIVE_PUBLIC_COUNTRY_FILTERS, (code) =>
    t(`countries.${code}`),
  );

  return (
    <>
      <MusicFilterSection
        heading={t('landing.decadeHeading')}
        pills={LANDING_DECADES.map((d) => {
          const active = decade === d.start;
          return {
            key: String(d.start),
            label: d.label,
            active,
            href: href({ decade: active ? undefined : d.start }),
          };
        })}
      />

      <MusicFilterSection
        heading={t('landing.tradeHeading')}
        pills={[
          {
            key: 'trade',
            label: t('landing.tradeOnly'),
            active: forTrade,
            href: href({ forTrade: !forTrade }),
          },
        ]}
      />

      <GenreBrowser
        genres={genres}
        activeSlug={genreSlug}
        currentParams={{ decade, country, forTrade, condition: conditionValue }}
      />

      <MusicFilterSection
        heading={t('landing.conditionHeading')}
        pills={(Object.keys(ALBUM_CONDITION_LABELS) as AlbumCondition[]).map((c) => {
          const active = conditionValue === c;
          return {
            key: c,
            label: t(`conditions.${c}`),
            active,
            href: href({ condition: active ? undefined : c }),
          };
        })}
      />

      <MusicFilterSection
        heading={t('landing.countryHeading')}
        pills={sortedCountries.map((code) => {
          const active = country === code;
          return {
            key: code,
            label: t(`countries.${code}`),
            active,
            href: href({ country: active ? undefined : code }),
          };
        })}
      />
    </>
  );
}
