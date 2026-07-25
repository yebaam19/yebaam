import { useTranslations } from 'next-intl';

interface Props {
  idDocumentUrl: string | null;
  photoUrls: { slot: number; url: string }[];
  onOpen: (url: string) => void;
}

/** ID document + the 5 verification photos rendered as inline thumbnails.
 *  Clicking a populated thumb emits its URL via `onOpen` so the parent can
 *  drive the lightbox. */
export function EvidenceGrid({ idDocumentUrl, photoUrls, onOpen }: Props) {
  const t = useTranslations('admin.verifications');

  const SLOT_LABELS = [t('slotProfile'), t('slotCover'), t('slotAdditional1'), t('slotAdditional2'), t('slotAdditional3')];

  const sortedPhotos = [...photoUrls].sort((a, b) => a.slot - b.slot);

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Thumb
        label={t('documentId')}
        url={idDocumentUrl}
        highlight
        onOpen={() => idDocumentUrl && onOpen(idDocumentUrl)}
      />
      {[1, 2, 3, 4, 5].map((slot) => {
        const photo = sortedPhotos.find((x) => x.slot === slot);
        return (
          <Thumb
            key={slot}
            label={SLOT_LABELS[slot - 1]}
            url={photo?.url ?? null}
            onOpen={() => photo && onOpen(photo.url)}
          />
        );
      })}
    </div>
  );
}

function Thumb({
  label,
  url,
  highlight,
  onOpen,
}: {
  label: string;
  url: string | null;
  highlight?: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations('admin.verifications');
  const ringCls = highlight
    ? 'ring-2 ring-amber-400 dark:ring-amber-500'
    : 'ring-1 ring-neutral-200 dark:ring-neutral-700';
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onOpen}
        disabled={!url}
        className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-neutral-100 ${ringCls} dark:bg-neutral-700 ${url ? 'cursor-zoom-in hover:opacity-90' : 'cursor-not-allowed opacity-50'}`}
      >
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" decoding="async" loading="lazy" />
        ) : (
          <span className="text-[10px] text-neutral-500">{t('noFile')}</span>
        )}
      </button>
      <span className="text-center text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}
