'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import { imageUrl } from '@/lib/media/urls';
import { saveCommunityRelatedLink } from '../../actions/relatedLinks.actions';
import { relatedLinkWriteSchema } from '../../schemas/communityRelatedLink.schema';
import type { CommunityRelatedLink } from '../../types/communityRelatedLink.types';
import type { LibraryAsset } from '../../types/communityLibrary.types';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';

export function RelatedLinkForm({ communityId, slug, initial, onSaved, onCancel }: {
  communityId: string; slug: string; initial: CommunityRelatedLink | null;
  onSaved: (message: string) => Promise<void>; onCancel: () => void;
}) {
  const id = useRef(initial?.id ?? crypto.randomUUID());
  const opener = useRef<HTMLButtonElement>(null);
  const [image, setImage] = useState<{ id: string; title: string; media_id: string; is_published: boolean; visibility: string } | null>(
    initial?.image ? { ...initial.image, is_published: true, visibility: 'public' } : null,
  );
  const [imageAssetId, setImageAssetId] = useState(initial?.image_asset_id ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(asset: LibraryAsset) {
    if (!asset.is_published || asset.visibility !== 'public') {
      setError('Publica la imagen para todos en la biblioteca antes de usarla aquí.');
      return;
    }
    setImage({ id: asset.id, title: asset.title, media_id: asset.media_id,
      is_published: asset.is_published, visibility: asset.visibility });
    setImageAssetId(asset.id);
    setError(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const value = { communityId, id: id.current, expectedVersion: initial?.version ?? 0,
      title: String(fields.get('title') ?? ''), description: String(fields.get('description') ?? ''),
      href: String(fields.get('href') ?? ''), imageAssetId,
      position: Number(fields.get('position') ?? 0), isPublished: fields.has('isPublished') };
    if (!relatedLinkWriteSchema.safeParse(value).success) {
      setError('Revisa el nombre, la dirección y la imagen antes de guardar.'); return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveCommunityRelatedLink(value);
      if (!result.ok) { setError(result.error); return; }
      await onSaved(value.isPublished ? 'Enlace publicado.' : 'Borrador guardado.');
    });
  }

  return <section className="space-y-4 border-t border-neutral-200 pt-5 dark:border-neutral-700">
    <h3 className="text-base font-semibold">{initial ? 'Editar página relacionada' : 'Nueva página relacionada'}</h3>
    <div className="space-y-2">
      {image && <div className="relative h-36 max-w-sm overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <Image src={imageUrl(image.media_id)} alt={image.title} fill sizes="384px" className="object-cover" unoptimized />
      </div>}
      <div className="flex flex-wrap items-center gap-2">
        <Button ref={opener} outline disabled={pending || pickerOpen} onClick={() => setPickerOpen(true)}>
          {image ? 'Cambiar imagen' : 'Elegir imagen'}
        </Button>
        {image && <Button plain disabled={pending || pickerOpen} onClick={() => { setImage(null); setImageAssetId(null); }}>Quitar</Button>}
        <Button plain href={`/feed/comunidades/${slug}/fotos`} target="_blank" rel="noreferrer">Biblioteca de fotos</Button>
      </div>
      <p className="text-xs text-neutral-600 dark:text-neutral-300">Para publicar, elige una imagen pública de esta comunidad.</p>
      {pickerOpen && <LibraryAssetPicker communityId={communityId} editorId="related-link" kinds={['image']}
        attachedIds={imageAssetId ? [imageAssetId] : []} onSelect={choose}
        onClose={() => { setPickerOpen(false); opener.current?.focus(); }} />}
    </div>
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={pending} className="space-y-4">
        <label className="block text-sm font-medium">Nombre<Input name="title" required maxLength={120} defaultValue={initial?.title} placeholder="Organización asociada" /></label>
        <label className="block text-sm font-medium">Descripción breve
          <textarea name="description" rows={3} maxLength={280} defaultValue={initial?.description}
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-800" />
        </label>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <label className="min-w-0 text-sm font-medium">Enlace<Input name="href" type="url" required maxLength={2048} defaultValue={initial?.href} placeholder="https://" /></label>
          <label className="text-sm font-medium">Orden<Input name="position" type="number" min={0} max={100000} required defaultValue={initial?.position ?? 0} /></label>
        </div>
        <label className="flex items-start gap-2 text-sm"><input name="isPublished" type="checkbox" defaultChecked={initial?.is_published ?? false}
          className="mt-0.5 size-4 accent-primary-800" />
          <span>Publicar ahora<span className="mt-1 block text-neutral-600 dark:text-neutral-300">Un borrador solo es visible para administradores.</span></span>
        </label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" color="brand" disabled={pending || pickerOpen}>{pending ? 'Guardando…' : 'Guardar enlace'}</Button>
        <Button outline disabled={pending} onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  </section>;
}
