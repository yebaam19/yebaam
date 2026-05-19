import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { CityImageField } from './CityImageField'

interface Props {
  city: AdminCityDetail
}

/**
 * Cover + logo manager. RSC shell — both fields are client islands so the
 * upload flow can drive `uploadService.uploadImage` from the browser.
 */
export async function CityImagesTab({ city }: Props) {
  const t = await getTranslations('admin.ciudades')
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('coverHeading')}
          </h2>
          <p className="text-xs text-neutral-500">{t('coverHint')}</p>
        </header>
        <CityImageField
          cityId={city.id}
          slot="cover"
          currentUrl={city.cover_image_url}
          aspect="aspect-[16/9]"
        />
      </section>
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('logoHeading')}
          </h2>
          <p className="text-xs text-neutral-500">{t('logoHint')}</p>
        </header>
        <CityImageField
          cityId={city.id}
          slot="logo"
          currentUrl={city.logo_image_url}
          aspect="aspect-square"
        />
      </section>
    </div>
  )
}
