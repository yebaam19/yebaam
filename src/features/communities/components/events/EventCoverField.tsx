'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { imageUrl } from '@/lib/media/urls';
import type { EventCover } from '../../types/communityEvent.types';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';
export function EventCoverField({ communityId, slug, id, cover, disabled, onChange, onPickerChange }: {
  communityId: string; slug: string; id: string | null; cover: EventCover | null; disabled: boolean;
  onChange: (id: string | null, cover: EventCover | null) => void; onPickerChange: (open: boolean) => void;
}) {
  const t = useTranslations('communities.events'); const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null); const wasOpen = useRef(false);
  useEffect(() => { if (open) wasOpen.current = true; else if (wasOpen.current) { opener.current?.focus(); wasOpen.current = false; } }, [open]);
  const toggle = (value: boolean) => { setOpen(value); onPickerChange(value); };
  return <div className="space-y-3">
    <h3 className="text-sm font-semibold">{t('cover')}</h3>
    {cover && <img src={imageUrl(cover.media_id)} alt={cover.title} className="max-h-48 w-full rounded-lg object-contain" />}
    {id && !cover && <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('coverUnavailable')}</p>}
    <div className="flex flex-wrap gap-2">
      <Button ref={opener} outline disabled={disabled || open} onClick={() => toggle(true)}>{t('chooseCover')}</Button>
      {id && <Button plain disabled={disabled || open} onClick={() => onChange(null, null)}>{t('removeCover')}</Button>}
      <Button plain href={`/feed/comunidades/${slug}/fotos`} target="_blank" rel="noreferrer">{t('photoLibrary')}</Button>
    </div>
    {open && <LibraryAssetPicker communityId={communityId} editorId="event" kinds={['image']} attachedIds={id ? [id] : []}
      onSelect={(asset) => onChange(asset.id, { id: asset.id, title: asset.title, media_id: asset.media_id })} onClose={() => toggle(false)} />}
  </div>;
}
