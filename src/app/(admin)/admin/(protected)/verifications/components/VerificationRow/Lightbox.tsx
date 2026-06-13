import { useTranslations } from 'next-intl';

interface Props {
  url: string;
  onClose: () => void;
}

/** Fullscreen overlay that shows a single evidence image. Backdrop and the
 *  close button both dismiss; clicking the image itself does not. */
export function Lightbox({ url, onClose }: Props) {
  const t = useTranslations('admin.verifications');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <img
        src={url}
        alt={t('lightboxAlt')}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20"
      >
        {t('close')}
      </button>
    </div>
  );
}
