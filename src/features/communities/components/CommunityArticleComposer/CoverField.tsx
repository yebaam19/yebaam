'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/ui/Button';
import { imageUrl } from '@/lib/media/urls';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';

export function CoverField({ communityId, slug, coverPreview, coverAssetId, disabled, onChange }: {
  communityId: string; slug: string; coverPreview: string | null; coverAssetId: string | null;
  disabled: boolean; onChange: (id: string | null, preview: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return <section className="space-y-3">
    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Imagen principal</h2>
    {coverPreview ? <div className="relative aspect-[16/7] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
      <Image src={coverPreview} alt="Vista previa de la portada" fill sizes="(max-width: 768px) 100vw, 800px"
        className="object-cover" unoptimized />
    </div> : <div className="flex min-h-36 items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
      Sin imagen principal
    </div>}
    <div className="flex flex-wrap gap-2">
      <Button ref={opener} outline disabled={disabled || open} onClick={() => setOpen(true)}>Elegir imagen</Button>
      {coverPreview && <Button plain disabled={disabled || open} onClick={() => onChange(null, null)}>Quitar imagen</Button>}
      <Button plain href={`/feed/comunidades/${slug}/fotos`} target="_blank" rel="noreferrer">Biblioteca de fotos</Button>
    </div>
    {open && <LibraryAssetPicker communityId={communityId} editorId="article-cover" kinds={['image']}
      attachedIds={coverAssetId ? [coverAssetId] : []}
      onClose={() => { setOpen(false); opener.current?.focus(); }}
      onSelect={(asset) => {
        onChange(asset.id, imageUrl(asset.media_id));
        setOpen(false); opener.current?.focus();
      }} />}
  </section>;
}
