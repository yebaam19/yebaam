import { DocumentIcon, PhotoIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type { FamilyDocKind, FamilyDocumentRow } from '../types/family.types';
import { DocumentDownloadButton } from './DocumentDownloadButton';

const KIND_LABEL: Record<FamilyDocKind, string> = {
  birth_cert: 'Acta de nacimiento',
  marriage_cert: 'Acta de matrimonio',
  death_cert: 'Acta de defunción',
  id: 'Identificación',
  letter: 'Carta',
  other: 'Otro',
};

export function FamilyDocumentsList({ documents }: { documents: FamilyDocumentRow[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <DocumentIcon className="h-10 w-10 text-zinc-400" />
        <h3 className="mt-3 text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Aún no hay documentos
        </h3>
        <p className="mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Sube actas, cartas o identificaciones. Las imágenes se guardan en Cloudflare; los PDFs en almacenamiento privado.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {documents.map((doc) => {
        const isImage = Boolean(doc.cf_image_id);
        return (
          <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isImage
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
              }`}
            >
              {isImage ? <PhotoIcon className="h-5 w-5" /> : <DocumentIcon className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {doc.title}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {KIND_LABEL[doc.kind]} · {isImage ? 'Imagen (Cloudflare)' : 'PDF (privado)'}
              </p>
            </div>
            {isImage && doc.cf_image_id ? (
              <a
                href={imageUrl(doc.cf_image_id, 'public')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Ver
              </a>
            ) : (
              <DocumentDownloadButton documentId={doc.id} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
