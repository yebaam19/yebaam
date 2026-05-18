import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

interface CitiesHeroProps {
  /**
   * Background cover image for the hero. Typically the cover photo of the
   * top featured city — passed in by the page so this stays a pure render.
   * When undefined, a city-toned gradient stands in.
   */
  backgroundImageUrl?: string
  /**
   * Alt text for the background image — usually the name of the city whose
   * cover is being used, so screen readers know what they're looking at.
   */
  backgroundImageAlt?: string
}

/**
 * Image-forward hero for `/cities`. RSC.
 *
 * Full-bleed cover photo behind a darkening gradient, with the campaign
 * headline and tagline anchored bottom-left. Mirrors the reference in
 * `docs/cities-reference/cities.png`: bold left-aligned title, soft subtitle,
 * generous vertical padding so the banner reads as a postcard, not a thin bar.
 */
export async function CitiesHero({
  backgroundImageUrl,
  backgroundImageAlt,
}: CitiesHeroProps) {
  const t = await getTranslations('cities')

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-neutral-900 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/5">
      {backgroundImageUrl ? (
        <Image
          src={backgroundImageUrl}
          alt={backgroundImageAlt ?? ''}
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="absolute inset-0 object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-emerald-900" />
      )}

      {/* Two stacked gradients: a left-to-right shade for the headline column,
          and a bottom darken so the text holds contrast even on bright covers. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-[260px] flex-col justify-end px-6 py-8 text-white sm:min-h-[300px] sm:px-10 sm:py-10 lg:min-h-[340px] lg:px-14 lg:py-12">
        <h1 className="max-w-2xl text-3xl font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:text-4xl lg:text-[3.25rem]">
          {t('hero.title')}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/90 drop-shadow-sm sm:text-base">
          {t('hero.subtitle')}
        </p>
      </div>
    </section>
  )
}
