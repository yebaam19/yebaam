'use client';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { uploadService } from '@/lib/service/upload.service';
import { MAX_IMAGE_BYTES } from '@/lib/upload-limits';
import { saveCommunityHeaderImage } from '../../actions/header-images.actions';
import { DEFAULT_IMAGE_FRAMING, type HeaderImages } from '../../schemas/communityHeaderImage.schema';
import { FramedImage } from './FramedImage';
import { ImageFramingControls } from './ImageFramingControls';

export function HeaderImageEditor({ communityId, target, images, currentUrl, onClose }: {
  communityId: string; target: 'cover' | 'profile'; images: HeaderImages; currentUrl?: string; onClose: () => void;
}) {
  const t = useTranslations('communities.headerImages');
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const removeButton = useRef<HTMLButtonElement>(null);
  const confirmRemoveButton = useRef<HTMLButtonElement>(null);
  const uploaded = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(currentUrl ?? '');
  const [framing, setFraming] = useState(images[target].framing);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (removing) confirmRemoveButton.current?.focus(); }, [removing]);
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  async function save(remove = false) {
    setPending(true); setError(null);
    try {
      let imageId = remove ? null : images[target].id;
      if (!remove && file) {
        if (!uploaded.current) uploaded.current = (await uploadService.uploadImage(file, undefined, { source: 'community-header' })).id;
        imageId = uploaded.current;
      }
      const result = await saveCommunityHeaderImage({ communityId, target, expectedVersion: images.version,
        imageId, framing: remove ? DEFAULT_IMAGE_FRAMING : framing });
      if (!result.ok) { setError(result.error); return; }
      router.refresh(); onClose();
    } catch { setError(t('saveError')); }
    finally { setPending(false); }
  }
  return <Dialog open onClose={() => { if (!pending) onClose(); }} className="relative z-[60]">
    <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
      <div className="flex min-h-full items-center justify-center">
        <DialogPanel className="w-full max-w-xl space-y-3 rounded-xl bg-white p-4 text-neutral-900 shadow-xl sm:p-6 dark:bg-neutral-900 dark:text-white">
          <DialogTitle className="text-lg font-semibold">{t(target === 'cover' ? 'editCover' : 'editProfile')}</DialogTitle>
          <Description className="text-sm text-neutral-600 dark:text-neutral-300">{t('previewHint')}</Description>
          {target === 'cover' && <div className="flex flex-wrap gap-2" aria-label={t('previewSize')}>
            <Button {...(mobilePreview ? { outline: true } : { color: 'brand' as const })} disabled={pending} aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}>{t('desktop')}</Button>
            <Button {...(mobilePreview ? { color: 'brand' as const } : { outline: true })} disabled={pending} aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}>{t('mobile')}</Button>
          </div>}
          <div className={target === 'profile' ? 'mx-auto size-36 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800'
            : `mx-auto overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 ${mobilePreview ? 'aspect-video w-full max-w-72' : 'aspect-[3/1] w-full'}`}>
            {preview ? <FramedImage key={preview} src={preview} alt={t('previewAlt')} framing={framing} priority
              onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setError(t('imageError')); }} />
              : <div className="flex h-full items-center justify-center p-4 text-center text-sm text-neutral-600 dark:text-neutral-300">{t('empty')}</div>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button outline disabled={pending || removing} onClick={() => input.current?.click()}>{t(preview ? 'replace' : 'choose')}</Button>
            <span className="text-xs text-neutral-600 dark:text-neutral-300">{t('fileHint')}</span>
          </div>
          <input ref={input} aria-label={t('choose')} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0]; event.target.value = '';
              if (!selected) return;
              if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(selected.type) || !selected.size || selected.size > MAX_IMAGE_BYTES) {
                setError(t('fileError')); return;
              }
              uploaded.current = null; setFile(selected); setLoaded(false); setError(null);
              setFraming(DEFAULT_IMAGE_FRAMING); setPreview(URL.createObjectURL(selected));
            }} />
          {preview && <ImageFramingControls value={framing} onChange={setFraming} disabled={pending || removing || !loaded} />}
          {images[target].id && !removing && <Button ref={removeButton} plain disabled={pending} onClick={() => setRemoving(true)}>{t('remove')}</Button>}
          {removing && <div className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <p className="text-sm">{t('removeConfirm')}</p>
            <div className="flex flex-wrap gap-2">
              <Button ref={confirmRemoveButton} color="brand" disabled={pending} onClick={() => save(true)}>{t('confirmRemove')}</Button>
              <Button outline disabled={pending} onClick={() => { setRemoving(false); requestAnimationFrame(() => removeButton.current?.focus()); }}>{t('keep')}</Button>
            </div>
          </div>}
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <Button color="brand" disabled={pending || removing || !preview || !loaded} onClick={() => save()}>{t(pending ? 'saving' : 'save')}</Button>
            <Button outline disabled={pending} onClick={onClose}>{t('cancel')}</Button>
          </div>
          {pending && <p role="status" className="text-sm text-neutral-600 dark:text-neutral-300">{t('savingHint')}</p>}
        </DialogPanel>
      </div>
    </div>
  </Dialog>;
}
