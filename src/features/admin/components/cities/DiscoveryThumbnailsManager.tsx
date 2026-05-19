import { getTranslations } from 'next-intl/server'
import { PORTAL_SECTIONS } from '@/features/cities/data/portal-sections'
import { cfImageUrl } from '@/features/cities/server/cf'
import { DiscoveryThumbnailRow } from './DiscoveryThumbnailRow'

interface Props {
  thumbnails: Record<string, string>
}

/**
 * 27 picture-card slots, one per portal section. Each row reads the current
 * CF image id from the map and renders a client island that owns the upload
 * + delete flow.
 */
export async function DiscoveryThumbnailsManager({ thumbnails }: Props) {
  const t = await getTranslations('admin.ciudades')
  const tSections = await getTranslations('cities.portal.sections')

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PORTAL_SECTIONS.map((section) => {
        const cfId = thumbnails[section.id]
        return (
          <DiscoveryThumbnailRow
            key={section.id}
            category={section.id}
            label={tSections(`${section.id}.label`)}
            cfImageId={cfId ?? null}
            currentUrl={cfImageUrl(cfId ?? null)}
            uploadCta={t('thumbnailUpload')}
            replaceCta={t('thumbnailReplace')}
            removeCta={t('thumbnailRemove')}
            removeConfirm={t('thumbnailRemoveConfirm')}
            uploading={t('uploading')}
            empty={t('thumbnailEmpty')}
            errorLabel={t('actionError')}
          />
        )
      })}
    </div>
  )
}
