import type { MediaAsset } from '../../types';

interface MediaGalleryManagerProps {
  media: MediaAsset[];
  onSetPrimary: (id: string) => void;
  onDeactivate: (id: string) => void;
  onEdit: (asset: MediaAsset) => void;
}

function mediaLabel(type: string) {
  const labels: Record<string, string> = {
    PROFILE_IMAGE: 'Logo',
    COVER_IMAGE: 'Portada',
    GALLERY: 'Galería',
    IMAGE: 'Imagen',
    VIDEO_URL: 'Video',
    VIDEO: 'Video',
    REEL: 'Reel',
    DOCUMENT: 'Documento',
  };
  return labels[type] ?? type;
}

export default function MediaGalleryManager({ media, onSetPrimary, onDeactivate, onEdit }: MediaGalleryManagerProps) {
  if (!media.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-black text-slate-900">Aún no hay fotos o reels</p>
        <p className="mt-1 text-sm text-slate-500">Sube una imagen o registra una URL externa para empezar a construir la galería pública.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {media.map((asset) => {
        const isVideo = ['VIDEO_URL', 'VIDEO', 'REEL'].includes(asset.type);
        return (
          <article key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-slate-100">
              {isVideo ? (
                <div className="flex h-full items-center justify-center bg-slate-900 text-center text-sm font-semibold text-white">
                  Reel / video externo
                </div>
              ) : (
                <img src={asset.url} alt={asset.title ?? asset.caption ?? ''} className="h-full w-full object-cover" />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-800">{mediaLabel(asset.type)}</span>
              {asset.isPrimary ? <span className="absolute right-3 top-3 rounded-full bg-[#006b2d] px-3 py-1 text-xs font-black text-white">Principal</span> : null}
            </div>
            <div className="p-4">
              <p className="line-clamp-1 text-sm font-black text-slate-900">{asset.title || asset.caption || 'Media sin título'}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{asset.description || asset.url}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(asset)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Editar</button>
                {!asset.isPrimary ? (
                  <button type="button" onClick={() => onSetPrimary(asset.id)} className="rounded-full border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Marcar principal</button>
                ) : null}
                <button type="button" onClick={() => onDeactivate(asset.id)} className="rounded-full border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Desactivar</button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
