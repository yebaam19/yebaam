'use client';

import { useRef, useState } from 'react';
import { Button } from '@/ui/Button';
import type { LibraryAsset } from '../../types/communityLibrary.types';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';

export function ArticleAttachments({ communityId, slug, assets, disabled, onChange }: {
  communityId: string; slug: string; assets: LibraryAsset[]; disabled: boolean;
  onChange: (assets: LibraryAsset[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return <section className="space-y-3">
    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Archivos adjuntos</h2>
    {assets.length ? <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
      {assets.map((asset) => <li key={asset.id} className="flex items-center justify-between gap-3 py-2 text-sm">
        <span className="min-w-0 truncate">{asset.title}</span>
        <Button plain disabled={disabled} onClick={() => onChange(assets.filter((item) => item.id !== asset.id))}
          aria-label={`Quitar ${asset.title}`}>Quitar</Button>
      </li>)}
    </ul> : <p className="text-sm text-neutral-600 dark:text-neutral-300">Ningún archivo adjunto.</p>}
    <div className="flex flex-wrap gap-2">
      <Button ref={opener} outline disabled={disabled || open || assets.length >= 20} onClick={() => setOpen(true)}>Adjuntar archivo</Button>
      <Button plain href={`/feed/comunidades/${slug}/archivos`} target="_blank" rel="noreferrer">Biblioteca de documentos</Button>
    </div>
    {open && <LibraryAssetPicker communityId={communityId} editorId="article-attachments" kinds={['document']}
      attachedIds={assets.map((asset) => asset.id)}
      onClose={() => { setOpen(false); opener.current?.focus(); }}
      onSelect={(asset) => {
        if (!assets.some((item) => item.id === asset.id)) onChange([...assets, asset]);
        setOpen(false); opener.current?.focus();
      }} />}
  </section>;
}
