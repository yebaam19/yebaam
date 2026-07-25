import { getTranslations } from 'next-intl/server';
import { imageUrl } from '@/lib/media/urls';

interface Props {
  backCoverCfImageId: string | null;
  labelCfImageId: string | null;
}

/** The "more images" gallery on the album detail page — back cover and label
 *  scan, each linking to the full-size Cloudflare image. Renders nothing when
 *  the album has neither. */
export async function AlbumExtraImages({ backCoverCfImageId, labelCfImageId }: Props) {
  if (!backCoverCfImageId && !labelCfImageId) return null;
  const t = await getTranslations('musica');

  const images = [
    backCoverCfImageId ? { id: backCoverCfImageId, alt: t('album.backCoverAlt') } : null,
    labelCfImageId ? { id: labelCfImageId, alt: t('album.labelImageAlt') } : null,
  ].filter((img): img is { id: string; alt: string } => img !== null);

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {t('album.moreImages')}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img) => (
          <a
            key={img.id}
            href={imageUrl(img.id, 'public')}
            target="_blank"
            rel="noopener noreferrer"
            className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            <img
              src={imageUrl(img.id, 'public')}
              alt={img.alt}
              className="aspect-square w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
